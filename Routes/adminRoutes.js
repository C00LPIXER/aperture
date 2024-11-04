const express = require("express");
const adminController = require("../Controllers/Admin/adminController");
const offerController = require("../Controllers/Admin/offerController");
const salesController = require("../Controllers/Admin/salesController");
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
routes.get("/admin/chart", adminAuth.isadminLogin, adminController.loadChart);
routes.get("/admin/login", adminAuth.isadminLogout, adminController.loadAdminLogin);
routes.post("/admin/login", adminAuth.isadminLogout, adminController.adminAuthentication);
routes.get("/admin/logout", adminController.adminLogout);

// ? [order management]
routes.get("/admin/orders", adminAuth.isAdmin, adminController.loadOrderList);
routes.get("/admin/orders/:id", adminAuth.isAdmin, adminController.loadOrderDetail);
routes.patch("/admin/orders/change-status", adminAuth.isAdmin, adminController.changeOrderStatus);

//? [user management]
routes.get("/admin/users", adminAuth.isAdmin, adminController.loadUserList);
routes.post("/admin/user/block_user/:id", adminAuth.isAdmin, adminController.blockUser);
routes.post("/admin/user/unblock_user/:id", adminAuth.isAdmin, adminController.unblockUser);

//? [category management]
routes.get("/admin/categories", adminAuth.isAdmin, adminController.loadCategoryPage);
routes.post("/admin/categories", adminAuth.isAdmin, adminController.createCategory);
routes.patch("/admin/categories/:id/list", adminAuth.isAdmin, adminController.listCategory);
routes.patch("/admin/categories/:id/unlist", adminAuth.isAdmin, adminController.unlistCategory);
routes.get("/admin/categories/edit/:id", adminAuth.isAdmin, adminController.loadEditCategory);
routes.put("/admin/categories/edit", adminAuth.isAdmin, adminController.editCategory);

//? [brand management]
routes.get("/admin/brands", adminAuth.isAdmin, adminController.loadBrandPage);
routes.post("/admin/brands", adminAuth.isAdmin, adminController.createBrand);
routes.patch("/admin/brands/:id/unlist", adminAuth.isAdmin, adminController.unlistBrand);
routes.patch("/admin/brands/:id/list", adminAuth.isAdmin, adminController.listBrand);
routes.get("/admin/brands/edit/:id", adminAuth.isAdmin, adminController.loadeditBrand);
routes.put("/admin/brands/edit", adminAuth.isAdmin, adminController.editBrand);

//? [product management]
routes.get("/admin/products", adminAuth.isAdmin, adminController.loadProductList);
routes.get("/admin/add_product", adminAuth.isAdmin, adminController.loadAddProduct);
routes.post("/admin/add_product", adminAuth.isAdmin, upload.array('product_images', 5), adminController.createProduct);
routes.get("/admin/edit_product/:id", adminAuth.isAdmin, adminController.LoadEditProduct);
routes.put("/admin/edit_product", adminAuth.isAdmin, upload.array('product_images', 5), adminController.editProduct);
routes.delete("/admin/edit_product/image", adminAuth.isAdmin, adminController.removeImage);
routes.patch("/admin/products/:id/block", adminAuth.isAdmin, adminController.blockProduct);
routes.patch("/admin/products/:id/unblock", adminAuth.isAdmin, adminController.unblockProduct);
 
//? [offer management]
routes.get("/admin/offers", adminAuth.isAdmin, offerController.loadOfferList)
routes.post("/admin/offers/add-offer", adminAuth.isAdmin, offerController.createOffer)
routes.delete("/admin/offers/delete", adminAuth.isAdmin, offerController.deleteOffer)

//? [coupon management]
routes.get("/admin/coupons", adminAuth.isAdmin, offerController.loadCouponList)
routes.post("/admin/coupons/add-coupon", adminAuth.isAdmin, offerController.createCoupon)
routes.delete("/admin/coupons/delete", adminAuth.isAdmin, offerController.deleteCoupon)

//? [sales report]
routes.get("/admin/sales", adminAuth.isAdmin, salesController.loadSales)
routes.post("/admin/sales", adminAuth.isAdmin, salesController.generateReport)
routes.get('/admin/download-pdf-report', salesController.downloadPDFReport);
routes.get('/admin/download-excel-report', salesController.downloadExcelReport);


module.exports = routes;