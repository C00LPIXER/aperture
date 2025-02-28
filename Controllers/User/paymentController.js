const paypal = require("paypal-rest-sdk");
const axios = require("axios");
const User = require("../../Models/userModel");
const Product = require("../../Models/productModel");
const Category = require("../../Models/categoryModel");
const Address = require("../../Models/userAddress");
const Brand = require("../../Models/brandsModel");
const Cart = require("../../Models/cartModel");
const Order = require("../../Models/orderModel");

const { PAYPAL_MODE, PAYPAL_CLIENT_ID, PAYPAL_CLIENT_SECRET, ROOT_URL } = process.env;
paypal.configure({
  mode: PAYPAL_MODE,
  client_id: PAYPAL_CLIENT_ID,
  client_secret: PAYPAL_CLIENT_SECRET,
});

//* currency conversion function
const convertCurrency = async (amountInINR) => {
  try {
    const response = await axios.get(
      "https://v6.exchangerate-api.com/v6/f0eebce530bb1f3c54e78968/latest/INR"
    );

    const conversionRate = response.data.conversion_rates.USD;
    const amountInUSD = (amountInINR * conversionRate).toFixed(2);

    return amountInUSD;
  } catch (error) {
    console.error("Currency conversion error:", error.message);
    return null;
  }
};

//* order with paypal
const payWithPaypal = async (req, res) => {
  try {
    req.session.payment = req.body;
    const totalPrice = req.body.totalPrice;
    let total = await convertCurrency(totalPrice);

    const create_payment_json = {
      intent: "sale",
      payer: {
        payment_method: "paypal",
      },
      redirect_urls: {
        return_url: `${ROOT_URL}/checkout/payment-success`,
        cancel_url: `${ROOT_URL}/checkout/payment-failed`,
      },
      transactions: [
        {
          amount: {
            currency: "USD",
            total: total,
          },
        },
      ],
    };

    paypal.payment.create(create_payment_json, function (error, payment) {
      if (error) {
        console.error(error.message);
        return res.json({ success: false, message: "Payment creation failed" });
      } else {
        for (let i = 0; i < payment.links.length; i++) {
          if (payment.links[i].rel === "approval_url") {
            return res.json({
              success: true,
              redirectUrl: payment.links[i].href,
            });
          }
        }
        res.json({
          success: false,
          message: "Approval URL not found in PayPal response",
        });
      }
    });
  } catch (error) {
    console.error("payWithPaypal:", error.message);
    res.status(500).render("internalError");
  }
};

const paymentSuccess = async (req, res) => {
  try {
    const { paymentMethod, totalPrice, shippingAddressId } =
      req.session.payment;
    const { paymentId, PayerID, token } = req.query;

    const userId = req.session.user;
    const cart = await Cart.findOne({ userId });
    const shippingAddress = await Address.findById(shippingAddressId);

    if (!shippingAddress) {
      return res.json({
        success: false,
        message: "Please make sure you select an address",
      });
    }

    const items = cart.items.map((item) => ({
      product: item.productId,
      quantity: item.quantity,
      price: item.price,
    }));

    const newOrder = new Order({
      userId: userId,
      shippingAddress: {
        name: shippingAddress.name,
        mobile: shippingAddress.mobile,
        pincode: shippingAddress.pincode,
        locality: shippingAddress.locality,
        city: shippingAddress.city,
        state: shippingAddress.state,
        landmark: shippingAddress.landmark,
        type: shippingAddress.type,
      },
      items: items,
      paymentMethod: paymentMethod,
      paymentId: paymentId,
      paymentStatus: "Completed",
      totalPrice: totalPrice,
      discount: cart.discount || 0,
      totalDiscount: cart.totalDiscount || 0,
      couponCode: cart.couponCode,
    });

    const savedOrder = await newOrder.save();
    if (savedOrder) {
      await Cart.findByIdAndDelete({ _id: cart._id });
      for (let item of items) {
        await Product.findByIdAndUpdate(item.product, {
          $inc: { stock: -item.quantity },
        });
      }
    }

    res.redirect(`/order-placed?ordeId=${savedOrder._id}`);
  } catch (error) {
    console.error("paymentSuccess:", error.message);
    res.status(500).render("internalError");
  }
};

const paymentCancel = async (req, res) => {
  try {
    const { paymentMethod, totalPrice, shippingAddressId } =
      req.session.payment;

    const userId = req.session.user;
    const cart = await Cart.findOne({ userId });
    const shippingAddress = await Address.findById(shippingAddressId);

    if (!shippingAddress) {
      return res.json({
        success: false,
        message: "Please make sure you select an address",
      });
    }

    const items = cart.items.map((item) => ({
      product: item.productId,
      quantity: item.quantity,
      price: item.price,
    }));

    const newOrder = new Order({
      userId: userId,
      shippingAddress: {
        name: shippingAddress.name,
        mobile: shippingAddress.mobile,
        pincode: shippingAddress.pincode,
        locality: shippingAddress.locality,
        city: shippingAddress.city,
        state: shippingAddress.state,
        landmark: shippingAddress.landmark,
        type: shippingAddress.type,
      },
      items: items,
      paymentMethod: paymentMethod,
      orderStatus: "Failed",
      paymentStatus: "Pending",
      totalPrice: totalPrice,
      discount: cart.discount || 0,
      totalDiscount: cart.totalDiscount || 0,
      couponCode: cart.couponCode,
    });

    const savedOrder = await newOrder.save();
    if (savedOrder) {
      await Cart.findByIdAndDelete({ _id: cart._id });
      for (let item of items) {
        await Product.findByIdAndUpdate(item.product, {
          $inc: { stock: -item.quantity },
        });
      }
    }

    res.redirect(`/order-placed?ordeId=${savedOrder._id}`);
  } catch (error) {
    console.error("paymentCancel:", error.message);
    res.status(500).render("internalError");
  }
};

const payFromOrder = async (req, res) => {
  try {
    const orderId = req.params.orderId;
    const { totalPrice } = await Order.findById(orderId);
    req.session.orderId = orderId;
    let total = await convertCurrency(totalPrice);

    const create_payment_json = {
      intent: "sale",
      payer: {
        payment_method: "paypal",
      },
      redirect_urls: {
        return_url: `${ROOT_URL}/profile/payment-success`,
        cancel_url: `${ROOT_URL}/profile/payment-failed`,
      },
      transactions: [
        {
          amount: {
            currency: "USD",
            total: total,
          },
        },
      ],
    };

    paypal.payment.create(create_payment_json, function (error, payment) {
      if (error) {
        console.error(error.message);
        return res.json({ success: false, message: "Payment creation failed" });
      } else {
        for (let i = 0; i < payment.links.length; i++) {
          if (payment.links[i].rel === "approval_url") {
            return res.json({
              success: true,
              redirectUrl: payment.links[i].href,
            });
          }
        }
        res.json({
          success: false,
          message: "Approval URL not found in PayPal response",
        });
      }
    });
  } catch (error) {
    console.error("payWithPaypal:", error.message);
    res.status(500).render("internalError");
  }
};

const payNowSuccess = async (req, res) => {
  try {
    const order = await Order.findByIdAndUpdate(req.session.orderId, {
      orderStatus: "Processing",
      paymentStatus: "Completed",
    });

    res.redirect("/profile#orders");
  } catch (error) {
    console.error(error.message);
    res.status(500).render("internalError");
  }
};

const payNowCancel = async (req, res) => {
  try {
    res.redirect("/profile#orders");
  } catch (error) {
    console.error(error.message);
    res.status(500).render("internalError");
  }
};

module.exports = {
  payWithPaypal,
  paymentSuccess,
  paymentCancel,
  payFromOrder,
  payNowSuccess,
  payNowCancel,
};
