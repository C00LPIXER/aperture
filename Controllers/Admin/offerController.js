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
    res.render("offers", { offers });
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
      maxLimit,
      discountValue,
      applicableTo,
      minPurchaseAmount,
      startDate,
      endDate,
    } = req.body;

    const isExist = await Offer.findOne({ title: title });

    if (isExist) {
      return res.json({
        success: false,
        message: "This offer already exists!",
      });
    }

    const offer = new Offer({
      title,
      discountType,
      description,
      maxLimit,
      discountValue,
      applicableTo,
      minPurchaseAmount,
      startDate,
      endDate,
    });
    await offer.save();
    return res.json({ success: true, message: "New offer created!" });
  } catch (error) {
    console.error(error.message);
  }
};

const deleteOffer = async (req, res) => {
  try {
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

    const cart = await Cart.findById(cartId)
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

    const cart = await Cart.findById(cartId).populate("items.productId")

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
    console.error(error.message);
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
