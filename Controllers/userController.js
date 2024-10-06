const User = require("../Modals/userModal");
const nodemailer = require("nodemailer");
const bcrypt = require("bcrypt");
const Product = require("../Modals/productModal");
const Category = require("../Modals/categoryModal");
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
      } else {
        console.log("Email sent: " + info.response);
      }
    });
  } catch (error) {
    console.log(error.message);
  }
};

const loadLandingPage = async (req, res) => {
  try {
    const product = await Product.find( { is_Active: true }).populate("category", "name").limit(12)
    res.render("landing",{ product });
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

const loadHomePage = async (req, res) => {
  try {
    const product = await Product.find({ is_Active: true }).populate("category", "name").limit(12)
    res.render("home", { product });
  } catch (error) {
    console.log(error.message);
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

const laodErrorPage = async (req, res) => {
  try {
    res.render("errorPage");
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
        req.flash("success_msg", "OTP verified successfully!");
        res.redirect("/login");
      } else {
        console.log("not verified");
        req.flash("error_msg", "Invalid OTP!");
        res.redirect("/verification");
      }
    } else {
      console.log("OTP expired");
      req.session.otp = null;
      req.session.otpTimestamp = null;
      req.flash("error_msg", "OTP has expired. Please resend OTP");
      res.redirect("/verification");
    }
  } catch (error) {
    console.log(error.message);
  }
};

const userAuthentication = async (req, res) => {
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
    if(userData.is_blocked){
      req.session.is_blocked = userData.is_blocked
      return res.json({ success: false, message: "This email has been blocked" });
    }
    const passwdMatch = await bcrypt.compare(password, userData.password);
    if (passwdMatch) {
      req.session.user = userData.email;
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
};

const productDetail = async (req, res) => {
  try {
    const productId = req.params.id
    const product = await Product.findById(productId).populate("category", "name").populate("brand", "name")
    const reProduct = await Product.find({category: product.category._id, is_Active: true}).limit(8)
      res.render("productDetail", { product, reProduct })
  } catch (error) {
    console.log(error.message);
  }
}

const loadLogout = async (req, res) => {
  try {
    req.session.user = null;
    res.redirect("/login");
  } catch (error) {
    console.lof(error.message);
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
  loadLogout,
  productDetail,
};

