const Offer = require("../../Models/offerModel");
const Coupon = require("../../Models/couponModel");
const Category = require("../../Models/categoryModel");
const Cart = require("../../Models/cartModel");
const Brands = require("../../Models/brandsModel");
const Product = require("../../Models/productModel");

//* offer manegement
const loadOfferList = async (req, res) => {
  try {
    const offers = await Offer.find();
    const brands = await Brands.find();
    const categories = await Category.find();
    res.render("offers", { offers, categories, brands });
  } catch (error) {
    console.error(error.message);
  }
};

const createOffer = async (req, res) => {
  try {
    const {
      title,
      discountType,
      description,
      discountValue,
      applicableTo,
      startDate,
      endDate,
      selectedBrands,
      selectedCategories,
    } = req.body;

    const isExist = await Offer.findOne({ title: title });
    if (isExist) {
      return res.json({
        success: false,
        message: "This offer already exists!",
      });
    }

    const brandsArray = JSON.parse(selectedBrands || "[]");
    const categoriesArray = JSON.parse(selectedCategories || "[]");

    const brands = await Brands.find({ name: { $in: brandsArray } });
    const categories = await Category.find({ name: { $in: categoriesArray } });

    const offer = new Offer({
      title,
      discountType,
      description,
      discountValue,
      applicableTo,
      startDate,
      endDate,
      brands,
      categories,
    });

    await offer.save();

    const query = {};
    if (brands.length > 0) {
      query.brand = { $in: brands.map((brand) => brand._id) };
    }
    if (categories.length > 0) {
      query.category = { $in: categories.map((category) => category._id) };
    }

    const products = await Product.find(query);

    const bulkOps = products.map((product) => {
      let discountPrice = product.price;

      if (discountType === "percentage") {
        discountPrice -= (product.price * discountValue) / 100;
      } else if (discountType === "fixed") {
        discountPrice -= discountValue;
      }

      discountPrice = Math.max(0, discountPrice);

      return {
        updateOne: {
          filter: { _id: product._id },
          update: { discount_price: discountPrice },
        },
      };
    });

    await Product.bulkWrite(bulkOps);

    return res.json({ success: true, message: "New offer created!" });
  } catch (error) {
    console.error(error.message);
  }
};

const deleteOffer = async (req, res) => {
  try {
    const id = req.body.id;
    const offer = await Offer.findByIdAndUpdate(id,{isActive: false});
    const query = {};
    if (offer.brands && offer.brands.length > 0) {
      query.brand = { $in: offer.brands.map((brand) => brand._id) };
    }
    
    if (offer.categories && offer.categories.length > 0) {
      query.category = {
        $in: offer.categories.map((category) => category._id),
      };
    }

    const products = await Product.find(query);
    if (products.length === 0) {
      return res.json({
        success: true,
        message: "Offer removed!",
      });
    }

    const bulkOps = products.map((product) => ({
      updateOne: {
        filter: { _id: product._id },
        update: { discount_price: 0 },
      },
    }));

    await Product.bulkWrite(bulkOps);

    return res.json({ success: true, message: "Offer removed!" });
  } catch (error) {
    console.error(error.message);
  }
};

//* coupon manegement
const loadCouponList = async (req, res) => {
  try {
    const coupon = await Coupon.find();
    res.render("coupons", { coupon });
  } catch (error) {
    console.error(error.message);
  }
};

const createCoupon = async (req, res) => {
  try {
    const {
      code,
      usageLimit,
      discountType,
      discountValue,
      minPurchaseAmount,
      maxPurchaseAmount,
      startDate,
      endDate,
    } = req.body;

    const isExist = await Coupon.findOne({
      code: { $regex: new RegExp(code, "i") },
    });
    if (isExist) {
      return res.json({
        success: false,
        message: "This offer already exists!",
      });
    }

    const coupon = new Coupon({
      code,
      usageLimit,
      discountType,
      discountValue,
      minPurchaseAmount,
      maxPurchaseAmount,
      startDate,
      endDate,
    });

    await coupon.save();
    res.json({ success: true, message: "New coupon created!" });
  } catch (error) {
    console.error(error.message);
  }
};

const deleteCoupon = async (req, res) => {
  try {
    const id = req.body.id;
    const coupon = await Coupon.findByIdAndDelete(id);
    res.json({ success: true, message: "Coupon removed!" });
  } catch (error) {
    console.error(error.message);
  }
};

const useCoupon = async (req, res) => {
  try {
    const { cartId, couponCode } = req.body;

    const coupon = await Coupon.findOne({ code: couponCode });

    if (!coupon) {
      return res.json({ success: false, message: "Invalid coupon Code!" });
    }

    const currentDate = new Date().setHours(0, 0, 0, 0);
    const startDate = new Date(coupon.startDate).setHours(0, 0, 0, 0);
    const endDate = new Date(coupon.endDate).setHours(0, 0, 0, 0);
    if (currentDate < startDate || currentDate > endDate) {
      return res.json({ success: false, message: "This coupon code expired!" });
    }

    const cart = await Cart.findById(cartId);
    if (cart.totalPrice < coupon.minPurchaseAmount) {
      return res.json({
        success: false,
        message: `Minimum purchase of ₹${coupon.minPurchaseAmount} required for this coupon`,
      });
    }

    if (cart.totalPrice > coupon.maxPurchaseAmount) {
      return res.json({
        success: false,
        message: `This coupon not applicable for this amoumt`,
      });
    }

    if (coupon.usedCount >= coupon.usageLimit) {
      return res.json({
        success: false,
        message: `This coupon's usage limit has been exceeded`,
      });
    }

    let discountAmount = 0;
    if (coupon.discountType === "percentage") {
      discountAmount = (coupon.discountValue / 100) * cart.totalPrice;
      if (
        coupon.maxDiscountAmount &&
        discountAmount > coupon.maxDiscountAmount
      ) {
        discountAmount = coupon.maxDiscountAmount;
      }
    } else if (coupon.discountType === "fixed") {
      discountAmount = coupon.discountValue;
    }

    cart.discount = Math.floor(discountAmount);
    cart.totalPrice = Math.floor(cart.totalPrice - discountAmount);
    cart.couponCode = couponCode;
    await cart.save();

    coupon.usedCount += 1;
    await coupon.save();

    return res.json({ success: true, message: "Coupon applied successfully!" });
  } catch (error) {
    console.error(error.message);
  }
};

const removeCoupon = async (req, res) => {
  try {
    const { cartId } = req.body;

    const cart = await Cart.findById(cartId).populate("items.productId");

    const appliedCouponCode = cart.couponCode;
    cart.discount = 0;
    cart.totalPrice = cart.items.reduce(
      (total, item) => total + item.productId.price * item.quantity,
      0
    );
    cart.couponCode = null;
    await cart.save();

    const coupon = await Coupon.findOne({ code: appliedCouponCode });
    if (coupon) {
      coupon.usedCount -= 1;
      await coupon.save();
    }

    return res.json({ success: true, message: "Coupon removed!" });
  } catch (error) {
    console.error("removeCoupon", error.message);
  }
};

module.exports = {
  loadOfferList,
  createOffer,
  deleteOffer,
  loadCouponList,
  createCoupon,
  deleteCoupon,
  useCoupon,
  removeCoupon,
};
