const express = require("express");
const User = require("../Models/userModel");
const userController = require("../Controllers/userController");
const userAuthentication = require("../middleware/userAuth");
const passport = require("passport");
const routes = express.Router();

//* user authentication
routes.get("/landing", userAuthentication.isLogout, userController.loadLandingPage);
routes.get("/", userAuthentication.isLogin, userController.loadHomePage);
routes.get("/login", userAuthentication.isLogout, userController.loadLoginPage);
routes.post("/login", userAuthentication.isLogout, userController.userAuthentication);
routes.get("/signup", userAuthentication.isLogout, userController.loadSignupPage);
routes.post("/signup", userAuthentication.isLogout, userController.createAccount);
routes.get("/verification", userAuthentication.isLogout, userController.loadotpVerification);
routes.post("/verification", userAuthentication.isLogout, userController.verifyOtp);
routes.get("/reSendOtp", userAuthentication.isLogout, userController.reSendOtp);
routes.get("/auth/google", userAuthentication.isLogout, passport.authenticate('google', {scope: ['profile', 'email'], }));
routes.get('/auth/google/callback', userAuthentication.isLogout, passport.authenticate('google', { failureRedirect: '/login' }), userController.googleCallback);

routes.get("/forgot-password", userAuthentication.isLogout, userController.loadForgotPasswordPage);
routes.post("/forgot-password/check-email", userAuthentication.isLogout, userController.sendResetPasswordOtp);
routes.get("/verify-email", userAuthentication.isLogout, userController.loadOtpVerificationPage);
routes.post("/verify-email", userAuthentication.isLogout, userController.verifyResetPasswordOtp);
routes.get("/reset-password", userAuthentication.isLogout, userController.loadResetPasswordPage);
routes.post("/reset-password/submit", userAuthentication.isLogout, userController.resetPassword);

routes.get("/logout", userController.loadLogout);


// * shop and product detail
// routes.get("/product-detail/:id", userAuthentication.isLogin, userController.productDetail)
routes.get("/product-detail/:id", userController.productDetail);
routes.get("/shop", userController.laodShopPage);
routes.get("/cart", userAuthentication.pleaseLogin, userController.laodCartPage);
routes.post("/add-to-cart", userController.addToCart);
routes.post("/cart/update-quantity", userAuthentication.isLogin, userController.selectQuantity);
routes.delete("/cart/reove-from-cart", userAuthentication.isLogin, userController.removeFromCart);

//* proceed to checkout
routes.get("/checkout", userAuthentication.isLogin, userController.laodCheckOutPage);
routes.post("/checkout/complete", userAuthentication.isLogin, userController.createOrder);
routes.get("/order-placed", userAuthentication.isLogin, userController.successPage);

// * user profile
routes.get("/profile", userAuthentication.pleaseLogin, userController.laodProfilePage);
routes.put("/profile/edit", userAuthentication.isLogin, userController.editUserInfo);
routes.post("/Profile/add-address", userAuthentication.isLogin, userController.addAddress);
routes.delete("/Profile/remove-address", userAuthentication.isLogin, userController.removeAddress);
routes.patch("/Profile/cancel-order", userAuthentication.isLogin, userController.cancelOrder);

//* error page
routes.get("/404", userController.laodErrorPage);

module.exports = routes; 
  