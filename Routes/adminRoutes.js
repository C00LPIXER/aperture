const express = require("express");
const adminController = require("../Controllers/adminController");
const adminAuth = require("../middleware/adminAuth");
const multer  = require('multer');
const path  = require('path');

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, path.join(__dirname, '../public/uploads'));
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + "_" + file.originalname);
    },
  });

const upload = multer({ storage: storage });

const app = express();

const routes = express.Router();

//? [admin authentication] 
routes.get("/admin", adminAuth.isadminLogin, adminController.loadAdminPage);
routes.get("/admin/login", adminAuth.isadminLogout, adminController.loadAdminLogin);
routes.post("/admin/login", adminAuth.isadminLogout, adminController.adminAuthentication);
routes.get("/admin/logout", adminController.adminLogout);

routes.get("/admin/orders", adminAuth.isAdmin, adminController.loadOrderList);
routes.get("/admin/order_details", adminAuth.isAdmin, adminController.loadOrderDetail);

//? [user manegement]
routes.get("/admin/users", adminAuth.isAdmin, adminController.loadUserList);
routes.post("/admin/user/block_user/:id", adminAuth.isAdmin, adminController.blockUser);
routes.post("/admin/user/unblock_user/:id", adminAuth.isAdmin, adminController.unblockUser);

//? [category manegement]
routes.get("/admin/categories", adminAuth.isAdmin, adminController.loadCategoryPage);
routes.post("/admin/categories", adminAuth.isAdmin, adminController.createCategory);
routes.patch("/admin/categories/:id/list", adminAuth.isAdmin, adminController.listCategory);
routes.patch("/admin/categories/:id/unlist", adminAuth.isAdmin, adminController.unlistCategory);
routes.get("/admin/categories/edit/:id", adminAuth.isAdmin, adminController.loadeditCategory);
routes.put("/admin/categories/edit", adminAuth.isAdmin, adminController.editCategory);

//? [brand manegement]
routes.get("/admin/brands", adminAuth.isAdmin, adminController.loadBrandPage);
routes.post("/admin/brands", adminAuth.isAdmin, adminController.createBrand);
routes.patch("/admin/brands/:id/unlist", adminAuth.isAdmin, adminController.unlistBrand);
routes.patch("/admin/brands/:id/list", adminAuth.isAdmin, adminController.listBrand);
routes.get("/admin/brands/edit/:id", adminAuth.isAdmin, adminController.loadeditBrand);
routes.put("/admin/brands/edit", adminAuth.isAdmin, adminController.editBrand);

//? [product manegement]
routes.get("/admin/products", adminAuth.isAdmin, adminController.loadProductList);
routes.get("/admin/add_product", adminAuth.isAdmin, adminController.loadAddProduct);
routes.post("/admin/add_product", adminAuth.isAdmin, upload.array('product_images', 5), adminController.createProduct);
routes.get("/admin/edit_product/:id", adminAuth.isAdmin, adminController.LoadEditProduct);
routes.put("/admin/edit_product", adminAuth.isAdmin, upload.array('product_images', 5), adminController.editProduct);
routes.delete("/admin/edit_product/image", adminAuth.isAdmin, adminController.removeImage);
routes.patch("/admin/products/:id/block", adminAuth.isAdmin, adminController.blockProduct);
routes.patch("/admin/products/:id/unblock", adminAuth.isAdmin, adminController.unblockProduct);
 

module.exports = routes;