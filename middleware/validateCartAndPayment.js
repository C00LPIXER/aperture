const Cart = require("../Models/cartModel");

const validateCartAndPayment = async (req, res, next) => {
  try {
    const userId = req.session.user;
    const cart = await Cart.findOne({ userId }).populate("items.productId");
    if (!cart || !cart.items || cart.items.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Cart is empty or not found. Please add items to your cart.",
      });
    }

    const toRemove = [];
    const insufficientStock = [];
    const activeItems = cart.items.filter((item) => {
      const product = item.productId;
      if (!product.is_Active || product.stock < item.quantity) {
        toRemove.push(product._id);
        if (product.stock < item.quantity) {
          insufficientStock.push({
            productId: product._id,
            name: product.name,
            availableStock: product.stock,
          });
        }
        return false;
      }
      return true;
    });

    if (toRemove.length > 0) {
      await Cart.findByIdAndUpdate(cart._id, { items: activeItems });

      const errorMessage =
        insufficientStock.length > 0
          ? "Some products are out of stock or unavailable: " +
            insufficientStock
              .map(
                (item) =>
                  `${item.name} (Requested: ${
                    cart.items.find((i) => i.productId.equals(item.productId))
                      .quantity
                  }, Available: ${item.availableStock})`
              )
              .join(", ")
          : "Some products are inactive or unavailable.";

      return res.json({
        success: false,
        message: errorMessage,
      });
    }

    req.validItems = activeItems;
    next();
  } catch (error) {
    console.error("validateCartAndPayment Error:", error.message);
    res.status(500).json({
      success: false,
      message: "An error occurred while validating the cart and payment.",
    });
  }
};

module.exports = {
  validateCartAndPayment,
};
