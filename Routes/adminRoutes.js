const express = require("express");
const adminController = require("../Controllers/adminController");
const multer  = require('multer')
const path  = require('path')

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

routes.get("/admin", adminController.loadAdminPage);

routes.get("/admin/orders", adminController.loadOrderList);
routes.get("/admin/order_details", adminController.loadOrderDetail);

routes.get("/admin/users", adminController.loadUserList);
routes.post("/admin/user/block_user/:id", adminController.blockUser);
routes.post("/admin/user/unblock_user/:id", adminController.unblockUser);

routes.get("/admin/categories", adminController.loadCategoryPage);
routes.post("/admin/categories/", adminController.createCategory);
routes.get("/admin/categories/list/:id", adminController.listCategory);
routes.get("/admin/categories/unlist/:id", adminController.unlistCategory);

routes.get("/admin/brands", adminController.loadBrandPage);
routes.post("/admin/brands", adminController.createBrand);
routes.post("/admin/brands", adminController.createBrand);
routes.get("/admin/brands/unlist/:id", adminController.unlistBrand);
routes.get("/admin/brands/list/:id", adminController.listBrand);

routes.get("/admin/products", adminController.loadProductList);
routes.get("/admin/add_product", adminController.loadAddProduct);
routes.post("/admin/products/block_product/:id", adminController.blockProduct);
routes.post("/admin/products/unblock_product/:id", adminController.unblockProduct);
routes.post("/admin/add_product/create", upload.array('product_images', 3), adminController.createProduct);

module.exports = routes; 