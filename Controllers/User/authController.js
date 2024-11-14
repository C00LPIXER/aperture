const User = require("../../Models/userModel");
const nodemailer = require("nodemailer");
const bcrypt = require("bcrypt");
const Product = require("../../Models/productModel");
const Category = require("../../Models/categoryModel");
const Address = require("../../Models/userAddress");
const Brand = require("../../Models/brandsModel");
const Cart = require("../../Models/cartModel");
const Order = require("../../Models/orderModel");
const passport = require("passport");
const flash = require("connect-flash/lib/flash");
const Banner = require("../../Models/bannerModel");;
require("dotenv").config();

const securePasswd = async (password) => {
  try {
    const Hash = await bcrypt.hash(password, 10);
    return Hash;
  } catch (error) {
    console.error(error.message);
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
        console.error(error);
      }
    });
  } catch (error) {
    console.error(error.message);
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
        console.error(error);
      }
    });
  } catch (error) {
    console.error(error.message);
  }
};

const loadErrorPage = async (req, res) => {
  try {
    res.render("errorPage");
  } catch (error) {
    console.error(error.message);
  }
};

//* user authentication
const loadLandingPage = async (req, res) => {
  try {
    const banner = await Banner.find()

    const activeProducts = await Product.find({ is_Active: true, stock: {$gt : 0} })
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

    res.render("landing", { product, banner });
  } catch (error) {
    console.error(error.message);
  }
};

const loadLoginPage = async (req, res) => {
  try {
    res.render("login");
  } catch (error) {
    console.error(error.message);
  }
};

const loadSignupPage = async (req, res) => {
  try {
    res.render("signup");
  } catch (error) {
    console.error(error.message);
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
    console.error(error.message);
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
    console.error(error.message);
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
    console.error(error.message);
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
    console.error(error.message);
  }
};

const loadLogout = async (req, res) => {
  try {
    req.session.user = null;
    res.redirect("/login");
  } catch (error) {
    console.error(error.message);
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
          console.error("Error while logging out", err.message);
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
    console.error(error.message);
  }
};

const loadForgotPasswordPage = (req, res) => {
  try {
    res.render("forgotPassword");
  } catch (error) {
    console.error(error.message);
  }
};

const sendResetPasswordOtp = async (req, res) => {
  try {
    const { email } = req.body;
    req.session.userEmail = email;
    const user = await User.findOne({ email });

    if (!user) {
      return res.json({ success: false, message: "Email does not exist" });
    }

    const otp = Math.floor(100000 + Math.random() * 900000);

    req.session.resetPasswordOtp = otp;
    req.session.otpTimestamp = Date.now();

    await sendResetPasswdEmail(email, otp);

    console.log(otp);

    res.json({ success: true, message: "OTP sent to your email" });
  } catch (error) {
    console.error(error.message);
  }
};

const loadOtpVerificationPage = (req, res) => {
  try {
    if (req.session.userEmail) {
      res.render("reserPasswordVerify");
    } else {
      res.redirect("/reset-password");
    }
  } catch (error) {
    console.error(error.message);
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
        return res.json({ success: true });
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
    console.error(error.message);
  }
};

const resendResetPasswordOtp = async (req, res) => {
  try {
    const email = req.session.userEmail;
    if (email) {
      const otp = Math.floor(100000 + Math.random() * 900000);

      req.session.resetPasswordOtp = otp;
      req.session.otpTimestamp = Date.now();
      await sendResetPasswdEmail(email, otp);
      console.log(otp);
      req.flash("success_msg", "New OTP has been resent to your email.");
      res.redirect("/verify-email");
    } else {
      res.redirect("/forgot-password");
    }
  } catch (error) {
    console.error(error.message);
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

    if (!req.session.otpVerified) {
      return res.json({ success: false, message: "Unauthorized request" });
    }

    const user = await User.findOne({ email: req.session.userEmail });
    if (!user) {
      return res.json({ success: false, message: "User not found" });
    }
    const sPasswd = await securePasswd(password);
    user.password = sPasswd;
    await user.save();

    req.session.otpVerified = null;

    res.json({ success: true, message: "Password successfully reset!" });
  } catch (error) {
    console.error("Error resetting password: ", error.message);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

module.exports = {
  loadLandingPage,
  loadLoginPage,
  loadSignupPage,
  createAccount,
  loadotpVerification,
  verifyOtp,
  userAuthentication,
  reSendOtp,
  loadErrorPage,
  googleCallback,
  loadForgotPasswordPage,
  sendResetPasswordOtp,
  verifyResetPasswordOtp,
  loadOtpVerificationPage,
  loadResetPasswordPage,
  resetPassword,
  resendResetPasswordOtp,
  loadLogout,
};