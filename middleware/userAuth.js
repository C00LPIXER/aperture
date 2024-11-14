const User = require("../Models/userModel");

const isLogin = async (req, res, next) => {
  try {
    if (req.session.user) {
      const user = await User.findById(req.session.user);
      if (user && user.is_blocked) {
        req.logOut((err) => {
          if (err) {
            console.log("Error logging out:", err.message);
          }
          req.session.user = null;
          res.clearCookie('connect.sid');
          req.flash('error_msg', 'Your account has been blocked by admin.');
          return res.redirect('/login');
        });
      } else {
        next();
      }
    } else {
      res.redirect("/landing");
    }
  } catch (error) {
    console.log(error.message);
  }
};

const pleaseLogin = async (req, res, next) => {
  try {
    if (req.session.user) {
      const user = await User.findById(req.session.user);
      if (user && user.is_blocked) {
        req.logOut((err) => {
          if (err) {
            console.log("Error logging out:", err.message);
          }
          req.session.user = null;
          res.clearCookie('connect.sid');
          req.flash('error_msg', 'Your account has been blocked by admin.');
          return res.redirect('/login');
        });
      } else {
        next();
      }
    } else {
      req.flash(
        "error_msg",
        "You need to log in to access this feature"
      );
      res.redirect("/login");
    }
  } catch (error) {
    console.log(error.message);
  }
};

const isLogout = async (req, res, next) => {
  try {
    if (req.session.user) {
      const user = await User.findById(req.session.user);
      if (user && user.is_blocked) {
        req.logOut((err) => {
          if (err) {
            console.log(err.message);
          }
          req.session.user = null;
          res.clearCookie('connect.sid');
          req.flash('error_msg', 'Your account has been blocked by admin.');
          return res.redirect('/login');
        });
      } else {
        res.redirect("/");
      }
    } else {
      next(); 
    }
  } catch (error) {
    console.log(error.message);
    res.status(500).send('Internal Server Error');
  }
};

module.exports = {
  isLogin,
  isLogout,
  pleaseLogin
};
 