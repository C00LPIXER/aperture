const mongoose = require("mongoose");
const User = require("../../Models/userModel");
const bcrypt = require("bcrypt");
const Address = require("../../Models/userAddress");
const Order = require("../../Models/orderModel");
const Wishlist = require("../../Models/wishlistModel");
const Review = require("../../Models/reviewModel");
const Product = require("../../Models/productModel");
const Wallet = require("../../Models/walletModel");
const PDFDocument = require("pdfkit");
require("dotenv").config();

const securePasswd = async (password) => {
  try {
    const Hash = await bcrypt.hash(password, 10);
    return Hash;
  } catch (error) {
    console.error(error.message);
  }
};

//* user profile manegement
const loadProfilePage = async (req, res) => {
  try {
    if (req.session.user) {
      const userId = req.session.user;
      const user = await User.findById(userId).populate("addresses");
      const wallet = await Wallet.findOne({ userId });
      const order = await Order.find({ userId })
        .sort({ placedAt: -1 })
        .populate("items.product")
        .populate("shippingAddress");
      if (user) {
        res.render("userProfile", { user, order, wallet });
      }
    }
  } catch (error) {
    console.error(error.message);
  }
};

const editUserInfo = async (req, res) => {
  try {
    const { firstName, lastName, id, currentPassword, newPassword } = req.body;
    const userData = await User.findById(id);

    if (!userData.password) {
      return res.json({
        success: false,
        message: "No paasword",
      });
    }
    if (currentPassword) {
      const passwdMatch = await bcrypt.compare(
        currentPassword,
        userData.password
      );

      if (passwdMatch) {
        const sPasswd = await securePasswd(newPassword);
        const user = await User.findByIdAndUpdate(id, {
          firstName: firstName,
          lastName: lastName,
          password: sPasswd,
        });
        res.json({
          success: true,
          user,
          message: "Profile updated successfully!",
        });
      } else {
        return res.json({
          success: false,
          message: "Incorrect password. Please try again.",
        });
      }
    } else {
      if (userData.firstName !== firstName || userData.lastName !== lastName) {
        const user = await User.findByIdAndUpdate(id, {
          firstName: firstName,
          lastName: lastName,
        });
        res.json({
          success: true,
          user,
          message: "Name updated successfully!",
        });
      } else {
        res.json({
          success: false,
          message: "Enter current password",
        });
      }
    }
  } catch (error) {
    console.error(error.message);
  }
};

const addAddress = async (req, res) => {
  try {
    const {
      name,
      mobile,
      pincode,
      locality,
      city,
      state,
      landmark,
      secondmobile,
      type,
    } = req.body;
    const userId = req.session.user;

    let numbers = [mobile];
    secondmobile ? numbers.push(secondmobile) : null;

    const newAddress = new Address({
      name,
      mobile: numbers,
      pincode,
      locality,
      city,
      state,
      landmark,
      type,
    });

    const savedAddress = await newAddress.save();

    const user = await User.findById(userId);
    user.addresses.push(savedAddress._id);
    await user.save();

    res.json({
      success: true,
      message: "Address added successfully",
      address: savedAddress,
    });
  } catch (error) {
    console.error(error.message);
  }
};

const editAddress = async (req, res) => {
  try {
    const {
      addressId,
      name,
      mobile,
      pincode,
      locality,
      city,
      state,
      landmark,
      secondmobile,
      type,
    } = req.body;

    let numbers = [mobile];
    secondmobile ? numbers.push(secondmobile) : null;

    const updatedAddress = await Address.findByIdAndUpdate(addressId, {
      name,
      mobile: numbers,
      pincode,
      locality,
      city,
      state,
      landmark,
      type,
    });
    if (updatedAddress) {
      res.json({ success: true, message: "Address updated successfully" });
    }
  } catch (error) {
    console.error(error.message);
  }
};

const removeAddress = async (req, res) => {
  try {
    const addressId = req.body.id;
    const userId = req.session.user;

    const user = await User.findByIdAndUpdate(userId, {
      $pull: { addresses: addressId },
    });

    await Address.findByIdAndDelete(addressId);

    res.json({ success: true, message: "Address removed successfully" });
  } catch (error) {
    console.error(error.message);
  }
};

const loadEditAddress = async (req, res) => {
  try {
    const userId = req.session.user;
    const addressId = req.params.id;
    const user = await User.findById(userId).populate("addresses");
    const address = user.addresses.find(
      (addr) => addr._id.toString() === addressId
    );

    res.render("editAddress", { address });
  } catch (error) {
    console.error(error.message);
  }
};

const addReview = async (req, res) => {
  try {
    const userId = req.session.user;
    const { productId, rating, review } = req.body;

    const NewReview = new Review({
      productId,
      userId,
      rating,
      review,
    });
    NewReview.save();

    const reviews = await Review.find();
    if (reviews.length > 0) {
      const totalRatings = reviews.reduce(
        (sum, review) => sum + review.rating,
        0
      );
      const avgRating = totalRatings / reviews.length;

      await Product.findByIdAndUpdate(productId, {
        ratings: avgRating,
      });
    }
    if (NewReview) {
      res.json({
        success: true,
        message: "Your review has been submitted successfully!",
      });
    }
  } catch (error) {
    console.error(error.message);
  }
};

const invoiceDownload = async (req, res) => {
  try {
    const orderId = req.params.id;
    const order = await Order.findById(orderId)
      .populate("userId")
      .populate("items.product");

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    const doc = new PDFDocument();
    const filename = `order_invoice_${Date.now()}.pdf`;
    res.setHeader("Content-disposition", `attachment; filename=${filename}`);
    res.setHeader("Content-type", "application/pdf");

    doc.pipe(res);

    doc.fontSize(20).text("Invoice", { align: "center" }).moveDown();
    doc.fontSize(12).text(`Order ID: ${order._id}`, { align: "center" });
    doc
      .fontSize(12)
      .text(`Order Date: ${new Date(order.placedAt).toDateString()}`, {
        align: "center",
      });
    doc.moveDown();

    doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke().moveDown();

    doc
      .fontSize(14)
      .text("Customer Details", { underline: true })
      .moveDown(0.5);
    doc
      .fontSize(12)
      .text(`Customer Email: ${order.userId.email}`)
      .text(`Order Status: ${order.orderStatus}`)
      .moveDown();

    doc
      .fontSize(14)
      .text("Shipping Address", { underline: true })
      .moveDown(0.5);
    doc
      .fontSize(12)
      .text(`Name: ${order.shippingAddress.name}`)
      .text(`Mobile: ${order.shippingAddress.mobile.join(", ")}`)
      .text(`Pincode: ${order.shippingAddress.pincode}`)
      .text(`Locality: ${order.shippingAddress.locality}`)
      .text(`City: ${order.shippingAddress.city}`)
      .text(`State: ${order.shippingAddress.state}`)
      .text(`Landmark: ${order.shippingAddress.landmark || "N/A"}`)
      .text(`Address Type: ${order.shippingAddress.type}`)
      .moveDown();

    doc.fontSize(14).text("Order Items", { underline: true }).moveDown(0.5);
    order.items.forEach((item, index) => {
      doc
        .fontSize(12)
        .text(`Item ${index + 1}: ${item.product.name || "Product Name"}`)
        .text(`Quantity: ${item.quantity}`)
        .text(`Price per Unit: ${item.price.toFixed(2)}`)
        .text(`Total: ${(item.price * item.quantity).toFixed(2)}`)
        .moveDown();
    });

    doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke().moveDown();

    doc.fontSize(14).text("Payment Details", { underline: true }).moveDown(0.5);
    doc
      .fontSize(12)
      .text(`Payment Method: ${order.paymentMethod}`)
      .text(`Payment Status: ${order.paymentStatus}`)
      .text(`Payment ID: ${order.paymentId || "N/A"}`)
      .moveDown();

    doc.fontSize(14).text("Pricing Summary", { underline: true }).moveDown(0.5);
    doc
      .fontSize(12)
      .text(`Subtotal: ${order.totalPrice.toFixed(2)}`)
      .text(`Shipping Fee: ${order.shippingFee.toFixed(2)}`)
      .text(`Discount: ${order.discount.toFixed(2)}`)
      .text(`Coupon Code: ${order.couponCode || "N/A"}`)
      .text(
        `Total Amount: ${(
          order.totalPrice +
          order.shippingFee -
          order.discount
        ).toFixed(2)}`
      )
      .moveDown();

    // Footer Note
    doc
      .fontSize(10)
      .text("Thank you for your purchase!", { align: "center" })
      .moveDown();

    doc.end();
  } catch (error) {
    console.error(error.message);
  }
};

//* wishlist
const loadWishlistPage = async (req, res) => {
  try {
    const userId = req.session.user;
    let wishlist = await Wishlist.findOne({ userId }).populate(
      "items.productId"
    );

    res.render("wishlist", { wishlist });
  } catch (error) {
    console.error(error.message);
  }
};

const addToWishlist = async (req, res) => {
  try {
    const userId = req.session.user;
    const productId = req.body.id;

    if (userId) {
      let wishlist = await Wishlist.findOne({ userId });

      if (wishlist) {
        const itemIndex = wishlist.items.findIndex(
          (item) => item.productId == productId
        );

        if (itemIndex > -1) {
          return res.json({ success: true, info: "Item already in wishlist" });
        } else {
          wishlist.items.push({ productId });
        }
      } else {
        wishlist = new Wishlist({
          userId,
          items: [{ productId }],
        });
      }

      await wishlist.save();
      return res.json({
        success: true,
        message: "Item added to wishlist",
      });
    } else {
      return res.json({
        success: false,
        info: "Please log in to continue!",
      });
    }
  } catch (error) {
    console.error(error.message);
  }
};

const removeFromWishlist = async (req, res) => {
  try {
    const productId = req.body.id;
    const userId = req.session.user;

    await Wishlist.findOneAndUpdate(
      { userId: userId },
      { $pull: { items: { productId: productId } } }
    );

    res.json({ success: true, message: "Item removed" });
  } catch (error) {
    console.error(error.message);
  }
};

module.exports = {
  loadProfilePage,
  editUserInfo,
  removeAddress,
  addAddress,
  editAddress,
  loadEditAddress,
  addReview,
  loadWishlistPage,
  addToWishlist,
  removeFromWishlist,
  invoiceDownload,
};
