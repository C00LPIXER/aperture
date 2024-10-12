const express = require("express");
const userController = require("../Controllers/userController");
const userAuthentication = require("../middleware/userAuth")
const passport = require("passport")
const routes = express.Router();

routes.get("/landing", userAuthentication.isLogout, userController.loadLandingPage);
routes.get("/", userAuthentication.isLogin, userController.loadHomePage);

routes.get("/login", userAuthentication.isLogout, userController.loadLoginPage);
routes.post("/login", userAuthentication.isLogout, userController.userAuthentication);

routes.get("/signup", userAuthentication.isLogout, userController.loadSignupPage);
routes.post("/signup", userAuthentication.isLogout, userController.createAccount);

routes.get("/verification", userAuthentication.isLogout, userController.loadotpVerification);
routes.post("/verification", userAuthentication.isLogout, userController.verifyOtp);
routes.get("/reSendOtp", userAuthentication.isLogout, userController.reSendOtp);

routes.get("/auth/google", passport.authenticate('google', {scope: ['profile', 'email'], }));
routes.get('/auth/google/callback', passport.authenticate('google', { failureRedirect: '/login' }), (req, res) => {
    if (req.user) {
        req.session.user = req.user.email;} res.redirect("/"); 
    });

// routes.get("/product-detail/:id", userAuthentication.isLogin, userController.productDetail)
routes.get("/product-detail/:id", userController.productDetail)

routes.get("/404", userController.laodErrorPage);

routes.get("/Logout", userController.loadLogout);

module.exports = routes; 
 