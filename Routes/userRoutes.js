const express = require("express");
const User = require("../Models/userModel");
const authController = require("../Controllers/User/authController");
const accountController = require("../Controllers/User/accountController")
const storeController = require("../Controllers/User/storeController")
const userAuthentication = require("../middleware/userAuth");
const passport = require("passport");
const routes = express.Router();

//* user authentication
routes.get("/landing", userAuthentication.isLogout, authController.loadLandingPage);
routes.get("/", userAuthentication.isLogin, storeController.loadHomePage);
routes.get("/login", userAuthentication.isLogout, authController.loadLoginPage);
routes.post("/login", userAuthentication.isLogout, authController.userAuthentication);
routes.get("/signup", userAuthentication.isLogout, authController.loadSignupPage);
routes.post("/signup", userAuthentication.isLogout, authController.createAccount);
routes.get("/verification", userAuthentication.isLogout, authController.loadotpVerification);
routes.post("/verification", userAuthentication.isLogout, authController.verifyOtp);
routes.get("/reSendOtp", userAuthentication.isLogout, authController.reSendOtp);

routes.get("/auth/google", userAuthentication.isLogout, passport.authenticate('google', {scope: ['profile', 'email'], }));
routes.get('/auth/google/callback', userAuthentication.isLogout, passport.authenticate('google', { failureRedirect: '/login' }), authController.googleCallback);

routes.get("/forgot-password", userAuthentication.isLogout, authController.loadForgotPasswordPage);
routes.post("/forgot-password/check-email", userAuthentication.isLogout, authController.sendResetPasswordOtp);
routes.get("/verify-email", userAuthentication.isLogout, authController.loadOtpVerificationPage);
routes.post("/verify-email", userAuthentication.isLogout, authController.verifyResetPasswordOtp);
routes.get("/verify-email/resend-otp", userAuthentication.isLogout, authController.resendResetPasswordOtp);
routes.get("/reset-password", userAuthentication.isLogout, authController.loadResetPasswordPage);
routes.post("/reset-password/submit", userAuthentication.isLogout, authController.resetPassword);
routes.get("/logout", authController.loadLogout);


// * shop and product detail
routes.get("/product-detail/:id", storeController.productDetail);
routes.get("/shop", storeController.loadShopPage);
routes.get("/cart", userAuthentication.pleaseLogin, storeController.loadCartPage);
routes.post("/add-to-cart", storeController.addToCart);
routes.post("/cart/update-quantity", userAuthentication.isLogin, storeController.selectQuantity);
routes.delete("/cart/reove-from-cart", userAuthentication.isLogin, storeController.removeFromCart);

//* proceed to checkout
routes.get("/checkout", userAuthentication.isLogin, storeController.loadCheckOutPage);
routes.post("/checkout/complete", userAuthentication.isLogin, storeController.createOrder);
routes.get("/order-placed", userAuthentication.isLogin, storeController.successPage);

// * user profile
routes.get("/profile", userAuthentication.pleaseLogin, accountController.loadProfilePage);
routes.put("/profile/edit", userAuthentication.isLogin, accountController.editUserInfo);
routes.post("/Profile/add-address", userAuthentication.isLogin, accountController.addAddress);
routes.delete("/Profile/remove-address", userAuthentication.isLogin, accountController.removeAddress);
routes.patch("/Profile/cancel-order", userAuthentication.isLogin, storeController.cancelOrder);
routes.get("/Profile/edit-address/:id", userAuthentication.isLogin, accountController.loadEditAddress);
routes.put("/Profile/edit-address", userAuthentication.isLogin, accountController.editAddress);
routes.post("/Profile/submit-review", userAuthentication.isLogin, accountController.addReview);

//* error page
routes.get("/not-found", authController.loadErrorPage);

module.exports = routes; 
  