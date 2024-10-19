const User = require("../Models/userModel");
const nodemailer = require("nodemailer");
const bcrypt = require("bcrypt");
const Product = require("../Models/productModel");
const Category = require("../Models/categoryModel");
const Address = require("../Models/userAddress");
const Brand = require("../Models/brandsModel");
const Cart = require("../Models/cartModel");
const Order = require("../Models/orderModel");
const passport = require("passport");
const flash = require("connect-flash/lib/flash");
require("dotenv").config();

const securePasswd = async (password) => {
  try {
    const Hash = await bcrypt.hash(password, 10);
    return Hash;
  } catch (error) {
    console.log(error.message);
  }
};

const SendVerificationEmail = async (email, OTP) => {
  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL,
        pass: process.env.EMAIL_PASSWORD,
      },
    });

    const mailOptions = {
      from: "amalkrishanp@gmail.com",
      to: email,
      subject: "Verify Your Email - Action Required",
      html: `<div style="font-family: Arial, sans-serif; color: #333;">
      <h2>Thank you for signing up with <strong>Aperture!</strong></h2>
      <p>To complete your registration and verify your email address, please use the OTP below:</p>

      <div>
        <h4>${OTP}</h4>
      </div>

      <p>This code is valid for the next <strong>1 minutes</strong>. For your security, please do not share this OTP with anyone.</p>

      <p>Thank you for choosing <strong>Aperture</strong>!</p>
      <p>Best regards,</p>
      <p>Amal Krishna<br/>Aperture</p>
    </div>`,
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.log(error);
      }
    });
  } catch (error) {
    console.log(error.message);
  }
};

const sendResetPasswdEmail = async (email, OTP) => {
  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL,
        pass: process.env.EMAIL_PASSWORD,
      },
    });

    const mailOptions = {
      from: "amalkrishanp@gmail.com",
      to: email,
      subject: "Reset Your Password - OTP Inside",
      html: `<div style="font-family: Arial, sans-serif; color: #333;">
          <h2>Password Reset Request</h2>
          <p>We received a request to reset your password. Please use the OTP below to proceed with resetting your password:</p>
    
          <div>
            <h4>${OTP}</h4>
          </div>
    
          <p>This OTP is valid for the next <strong>1 minute</strong>. If you did not request a password reset, please disregard this email.</p>
    
          <p>For your security, do not share this OTP with anyone.</p>
    
          <p>Thank you,<br/>
          Amal Krishna<br/>Aperture Support Team</p>
        </div>`,
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.log(error);
      }
    });
  } catch (error) {
    console.log(error.message);
  }
};

const laodErrorPage = async (req, res) => {
  try {
    res.render("errorPage");
  } catch (error) {
    console.log(error.message);
  }
};

//* user authentication
const loadLandingPage = async (req, res) => {
  try {
    const activeProducts = await Product.find({ is_Active: true })
      .populate({
        path: "category",
        select: "name",
        match: { is_Active: true },
      })
      .populate({ path: "brand", select: "name", match: { is_Active: true } })
      .limit(12);

    const product = activeProducts.filter(
      (product) => product.category && product.brand
    );

    res.render("landing", { product });
  } catch (error) {
    console.log(error);
  }
};

const loadLoginPage = async (req, res) => {
  try {
    res.render("login");
  } catch (error) {
    console.log(error);
  }
};

const loadSignupPage = async (req, res) => {
  try {
    res.render("signup");
  } catch (error) {
    console.log(error);
  }
};

const loadotpVerification = async (req, res) => {
  try {
    if (req.session.userData) {
      res.render("otpVerification");
    } else {
      res.redirect("/signup");
    }
  } catch (error) {
    console.log(error.message);
  }
};

const createAccount = async (req, res) => {
  try {
    const isExist = await User.findOne({ email: req.body.email });
    if (isExist) {
      return res.json({ success: false, message: "Email already exists!" });
    }
    req.session.userData = req.body;
    const OTP = Math.floor(100000 + Math.random() * 900000);
    req.session.otp = OTP;
    req.session.otpTimestamp = Date.now();
    SendVerificationEmail(req.body.email, OTP);
    console.log(OTP);
    return res.json({ success: true, redirect: "/verification" });
  } catch (error) {
    console.error(error.message);
  }
};

const reSendOtp = async (req, res) => {
  try {
    const { email } = req.session.userData;
    const OTP = Math.floor(100000 + Math.random() * 900000);
    req.session.otp = OTP;
    req.session.otpTimestamp = Date.now();
    SendVerificationEmail(email, OTP);
    console.log(OTP);
    req.flash("success_msg", "New OTP has been resent to your email.");
    res.redirect("/verification");
  } catch (error) {
    console.log(error.message);
  }
};

const verifyOtp = async (req, res) => {
  try {
    const currentTime = Date.now();
    const otpTimestamp = req.session.otpTimestamp;

    if (req.session.otp && currentTime - otpTimestamp <= 60000) {
      if (req.session.otp == req.body.otp) {
        const { firstName, lastName, email, password } = req.session.userData;
        const sPasswd = await securePasswd(password);
        const user = new User({
          firstName: firstName,
          lastName: lastName,
          email: email,
          password: sPasswd,
          signUpDate: String(Date()),
        });
        await user.save();
        req.session.otp = null;
        req.session.verified = true;
        req.session.otpTimestamp = null;
        res.json({ success: true });
      } else {
        console.log("not verified");
        res.json({ success: false, message: "Invalid OTP!" });
      }
    } else {
      console.log("OTP expired");
      req.session.otp = null;
      req.session.otpTimestamp = null;
      res.json({
        success: false,
        message: "OTP has expired. Please resend OTP",
      });
    }
  } catch (error) {
    console.log(error.message);
  }
};

const userAuthentication = async (req, res) => {
  try {
    const email = req.body.email;
    const password = req.body.password;
    const userData = await User.findOne({ email: email });

    if (userData) {
      if (!userData.password) {
        return res.json({
          success: false,
          message: "Invalid credentials, please try again.",
        });
      }
      if (userData.is_blocked) {
        req.session.is_blocked = userData.is_blocked;
        return res.json({
          success: false,
          message: "This email has been blocked",
        });
      }
      const passwdMatch = await bcrypt.compare(password, userData.password);
      if (passwdMatch) {
        req.session.user = userData.id;
        return res.json({ success: true, message: "Login successful!" });
      } else {
        return res.json({
          success: false,
          message: "Incorrect password. Please try again.",
        });
      }
    } else {
      return res.json({
        success: false,
        message: "Invalid credentials, please try again.",
      });
    }
  } catch (error) {
    console.log(error.message);
  }
};

const loadLogout = async (req, res) => {
  try {
    req.session.user = null;
    res.redirect("/login");
  } catch (error) {
    console.log(error.message);
  }
};

const googleCallback = async (req, res) => {
  try {
    req.session.user = req.user.id;
    const id = req.session.user;
    const userData = await User.findById(id);

    if (userData.is_blocked == 1) {
      req.logOut((err) => {
        if (err) {
          console.log("Error while logging out", err.message);
        }
        req.session.user = null;
        res.clearCookie("connect.sid");

        req.flash("error_msg", "User is blocked by admin");
        return res.redirect("/login");
      });
    } else {
      res.redirect("/");
    }
  } catch (error) {
    console.error("Error during Google callback:", error.message);
    res.status(500).send("Internal server error");
  }
};

const loadForgotPasswordPage = (req, res) => {
  try {
    res.render("forgotPassword");
  } catch (error) {
    console.error("Error loading forgot password page: ", error.message);
  }
};

const sendResetPasswordOtp = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      return res.json({ success: false, message: "Email does not exist" });
    }

    const otp = Math.floor(100000 + Math.random() * 900000);

    req.session.resetPasswordOtp = otp;
    req.session.otpTimestamp = Date.now();

    await sendResetPasswdEmail(email, otp);

    console.log(`OTP sent to ${email}: ${otp}`);

    res.json({ success: true, message: "OTP sent to your email" });
  } catch (error) {
    console.error("Error sending OTP: ", error.message);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

const loadOtpVerificationPage = (req, res) => {
  try {
    res.render("reserPasswordVerify");
  } catch (error) {
    console.error("Error loading OTP verification page: ", error.message);
  }
};

const verifyResetPasswordOtp = (req, res) => {
  try {
    const { otp } = req.body;
    const currentTime = Date.now();

    const sessionOtp = req.session.resetPasswordOtp;
    const otpTimestamp = req.session.otpTimestamp;

    if (sessionOtp && currentTime - otpTimestamp <= 5 * 60 * 1000) {
      if (sessionOtp === parseInt(otp, 10)) {
        req.session.resetPasswordOtp = null;
        req.session.otpVerified = true;
        return res.json({success: true});
      } else {
        return res.json({ success: false, message: "Invalid OTP!" });
      }
    } else {
      return res.json({
        success: false,
        message: "OTP expired. Please request a new one.",
      });
    }
  } catch (error) {
    console.error("Error verifying OTP: ", error.message);
  }
};

const loadResetPasswordPage = (req, res) => {
  try {
    if (req.session.otpVerified) {
      res.render("resetPassword");
    } else {
      res.redirect("/forgot-password");
    }
  } catch (error) {
    console.error("Error loading reset password page: ", error.message);
  }
};

const resetPassword = async (req, res) => {
  try {
    const { password } = req.body;

    // Ensure OTP was verified
    if (!req.session.otpVerified) {
      return res.json({ success: false, message: "Unauthorized request" });
    }

    // Reset the password in the database
    const user = await User.findOne({ email: req.body.email });
    if (!user) {
      return res.json({ success: false, message: "User not found" });
    }

    user.password = await bcrypt.hash(password, 10); // Hash the new password
    await user.save();

    // Clear the OTP verification session
    req.session.otpVerified = null;

    res.json({ success: true, message: "Password successfully reset!" });
  } catch (error) {
    console.error("Error resetting password: ", error.message);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

//* shop
const loadHomePage = async (req, res) => {
  try {
    const activeProducts = await Product.find({ is_Active: true })
      .populate({
        path: "category",
        select: "name",
        match: { is_Active: true },
      })
      .populate({ path: "brand", select: "name", match: { is_Active: true } })
      .limit(12);

    const product = activeProducts.filter(
      (product) => product.category && product.brand
    );

    res.render("home", { product });
  } catch (error) {
    console.log(error.message);
  }
};

const laodShopPage = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12;

    const search = req.query.search || "";
    const category = req.query.category || "";
    const brand = req.query.brand || "";
    const sort = req.query.sort || "";

    console.log(
      "search:",
      search,
      "category:",
      category,
      "brand:",
      brand,
      "sort:",
      sort
    );

    const totalProducts = await Product.countDocuments();
    const categories = await Category.find();
    const brands = await Brand.find();

    const searchTerms = search.trim().split(/\s+/);
    const regexPatterns = searchTerms.map(
      (term) => new RegExp(`\\b${term}\\b`, "i")
    );

    const activeProducts = await Product.find({
      is_Active: true,
      $or: [
        { name: { $in: regexPatterns } },
        { description: { $in: regexPatterns } },
      ],
    })
      .populate({
        path: "category",
        select: "name",
        match: { is_Active: true },
      })
      .populate({ path: "brand", select: "name", match: { is_Active: true } })
      .skip((page - 1) * limit)
      .limit(limit);

    res.render("shop", {
      categories,
      totalProducts,
      activeProducts,
      brands,
      currentPage: page,
      totalPages: Math.ceil(totalProducts / limit),
      limit,
    });
  } catch (error) {
    console.log(error.message);
  }
};

const productDetail = async (req, res) => {
  try {
    const productId = req.params.id;
    const product = await Product.findById(productId)
      .populate("category", "name")
      .populate("brand", "name");

    const relatedProduct = await Product.find({
      category: product.category._id,
      is_Active: true,
      _id: { $ne: product._id },
    }).limit(8);
    res.render("productDetail", { product, relatedProduct });
  } catch (error) {
    console.log(error.message);
  }
};

//* cart
const laodCartPage = async (req, res) => {
  try {
    const userId = req.session.user;
    const cart = await Cart.findOne({ userId }).populate("items.productId");
    if (cart) {
      cart.totalPrice = cart.items.reduce(
        (total, item) => total + item.productId.price * item.quantity,
        0
      );
    }
    res.render("cart", { cart });
  } catch (error) {
    console.log(error.message);
  }
};

const addToCart = async (req, res) => {
  try {
    const productId = req.body.id;
    const userId = req.session.user;
    const product = await Product.findById(productId);

    if (userId) {
      let cart = await Cart.findOne({ userId });

      if (cart) {
        const itemIndex = cart.items.findIndex(
          (item) => item.productId == productId
        );

        if (itemIndex > -1) {
          return res.json({ success: true, info: "Item already in cart" });
        } else {
          cart.items.push({ productId, quantity: 1, price: product.price });
        }
      } else {
        cart = new Cart({
          userId,
          items: [{ productId, quantity: 1, price: product.price }],
        });
      }
      await cart.save();
      res.json({
        success: true,
        message: "Item added to cart",
      });
    } else {
      res.json({
        success: true,
        info: "Please log in to continue adding items to your cart",
      });
    }
  } catch (error) {
    console.log(error.message);
  }
};

const selectQuantity = async (req, res) => {
  try {
    const { productId, isIncrement } = req.body;
    const userId = req.session.user;

    const cart = await Cart.findOne({ userId, "items.productId": productId });
    const product = await Product.findOne({ _id: productId });
    const item = cart.items.find(
      (item) => item.productId.toString() === productId.toString()
    );

    if (item) {
      if (isIncrement === "1") {
        if (item.quantity < 5 && item.quantity < product.stock) {
          await Cart.updateOne(
            { userId, "items.productId": productId },
            { $inc: { "items.$.quantity": 1 } }
          );
        } else {
          return res.json({
            success: false,
            message: "Cannot exceed maximum quantity or stock limit",
          });
        }
      } else if (item.quantity > 1) {
        await Cart.updateOne(
          { userId, "items.productId": productId },
          { $inc: { "items.$.quantity": -1 } }
        );
      } else {
        return res.json({
          success: false,
          message: "Quantity cannot be less than 1",
        });
      }
    }

    res.json({ success: true });
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ success: false, message: "Something went wrong" });
  }
};

const removeFromCart = async (req, res) => {
  try {
    const productId = req.body.id;
    const userId = req.session.user;

    await Cart.findOneAndUpdate(
      { userId: userId },
      { $pull: { items: { productId: productId } } }
    );

    res.json({ success: true, message: "Item removed" });
  } catch (error) {
    console.log(error.message);
  }
};

//* proceed to checkout
const laodCheckOutPage = async (req, res) => {
  try {
    const userId = req.session.user;
    const user = await User.findById(userId).populate("addresses");
    const cart = await Cart.findOne({ userId }).populate("items.productId");
    if (cart) {
      cart.totalPrice = cart.items.reduce(
        (total, item) => total + item.productId.price * item.quantity,
        0
      );
      res.render("checkOut", { cart, user });
    } else {
      res.redirect("/cart");
    }
  } catch (error) {
    console.log(error.message);
  }
};

const createOrder = async (req, res) => {
  try {
    const userId = req.session.user;
    const { shippingAddressId, paymentMethod, totalPrice } = req.body;
    const cart = await Cart.findOne({ userId });
    const items = cart.items.map((item) => ({
      product: item.productId,
      quantity: item.quantity,
      price: item.price,
    }));

    const newOrder = new Order({
      userId: userId,
      shippingAddress: shippingAddressId,
      items: items,
      paymentMethod: paymentMethod,
      totalPrice: totalPrice,
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

    res.json({ success: true, message: "Order created successfully" });
  } catch (error) {
    console.log(error.message);
  }
};

const cancelOrder = async (req, res) => {
  try {
    const orederId = req.body.orederId;
    const order = await Order.findByIdAndUpdate(
      { _id: orederId },
      { orderStatus: "Cancelled" }
    );

    for (let item of order.items) {
      await Product.findByIdAndUpdate(item.product, {
        $inc: { stock: item.quantity },
      });
    }

    res.json({ status: true, message: "Order cancelled" });
  } catch (error) {
    console.log(error.message);
  }
};

const successPage = async (req, res) => {
  try {
    res.render("success");
  } catch (error) {
    console.log(error.message);
  }
};

//* user profile manegement
const laodProfilePage = async (req, res) => {
  try {
    if (req.session.user) {
      const userId = req.session.user;
      const user = await User.findById(userId).populate("addresses");
      const order = await Order.find({ userId })
        .populate("items.product")
        .populate("shippingAddress");
      if (user) {
        res.render("userProfile", { user, order });
      }
    }
  } catch (error) {
    console.log(error.message);
  }
};

const editUserInfo = async (req, res) => {
  try {
    const { firstName, lastName, id, currentPassword, newPassword } = req.body;
    const userData = await User.findById(id);

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
      if(userData.firstName !== firstName || userData.lastName !== lastName){
        const user = await User.findByIdAndUpdate(id, {
          firstName: firstName,
          lastName: lastName,
        });
        res.json({
          success: true,
          user,
          message: "Name updated successfully!",
        });
      }else{
        res.json({
          success: false,
          message: "Enter current password",
        });
      }
    }
  } catch (error) {
    console.log(error.message);
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
    console.log(error.message);
  }
};

const editAddress = async (req, res) => {
  try {
  } catch (error) {
    console.log(error.message);
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
    console.log(error.message);
  }
};

module.exports = {
  loadLandingPage,
  loadHomePage,
  loadLoginPage,
  loadSignupPage,
  createAccount,
  loadotpVerification,
  verifyOtp,
  userAuthentication,
  reSendOtp,
  laodErrorPage,
  googleCallback,
  loadForgotPasswordPage,
  sendResetPasswordOtp,
  verifyResetPasswordOtp,
  loadOtpVerificationPage,
  loadResetPasswordPage,
  resetPassword,
  loadLogout,

  productDetail,
  laodShopPage,
  laodCartPage,
  laodProfilePage,
  editUserInfo,
  removeAddress,
  addAddress,
  addToCart,
  removeFromCart,
  selectQuantity,
  laodCheckOutPage,
  createOrder,
  cancelOrder,
  successPage,
};
