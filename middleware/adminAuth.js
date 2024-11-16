const isadminLogin = async (req, res, next) => {
  try {
    if (req.session.admin) {
      next();
    } else {
      res.redirect("/admin/login");
    }
  } catch (error) {
    console.error(error.message);
    res.status(500).render("adminError");
  }
};

const isadminLogout = async (req, res, next) => {
  try {
    if (req.session.admin) {
      res.redirect("/admin");
    } else {
      next();
    }
  } catch (error) {
    console.error(error.message);
    res.status(500).render("adminError");
  }
};

const isAdmin = (req, res, next) => {
  if (req.session.admin) {
    next();
  } else {
    res.redirect("/admin/login");
  }
};

module.exports = {
  isadminLogin,
  isadminLogout,
  isAdmin,
};
