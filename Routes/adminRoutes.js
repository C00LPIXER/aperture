const express = require("express");
const adminController = require("../Controllers/Admin/adminController");
const offerController = require("../Controllers/Admin/offerController");
const salesController = require("../Controllers/Admin/salesController");
const adminAuth = require("../middleware/adminAuth");
const routes = express.Router();
const cloudinary = require('cloudinary').v2;
const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const path  = require('path');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'uploads',
    format: async (req, file) => 'jpg',
    public_id: (req, file) => Date.now() + "_" + file.originalname.split('.')[0], 
  },
});

const upload = multer({ storage: storage });

const app = express();

//? [admin authentication] 
routes.get("/", adminAuth.isadminLogin, adminController.loadAdminPage);
routes.get("/chart", adminAuth.isadminLogin, adminController.loadChart);
routes.get("/login", adminAuth.isadminLogout, adminController.loadAdminLogin);
routes.post("/login", adminAuth.isadminLogout, adminController.adminAuthentication);
routes.get("/logout", adminController.adminLogout);

// ? [order management]
routes.get("/orders", adminAuth.isAdmin, adminController.loadOrderList);
routes.get("/orders/:id", adminAuth.isAdmin, adminController.loadOrderDetail);
routes.patch("/orders/change-status", adminAuth.isAdmin, adminController.changeOrderStatus);

//? [user management]
routes.get("/users", adminAuth.isAdmin, adminController.loadUserList);
routes.post("/user/block_user/:id", adminAuth.isAdmin, adminController.blockUser);
routes.post("/user/unblock_user/:id", adminAuth.isAdmin, adminController.unblockUser);

//? [category management]
routes.get("/categories", adminAuth.isAdmin, adminController.loadCategoryPage);
routes.post("/categories", adminAuth.isAdmin, adminController.createCategory);
routes.patch("/categories/:id/list", adminAuth.isAdmin, adminController.listCategory);
routes.patch("/categories/:id/unlist", adminAuth.isAdmin, adminController.unlistCategory);
routes.get("/categories/edit/:id", adminAuth.isAdmin, adminController.loadEditCategory);
routes.put("/categories/edit", adminAuth.isAdmin, adminController.editCategory);

//? [brand management]
routes.get("/brands", adminAuth.isAdmin, adminController.loadBrandPage);
routes.post("/brands", adminAuth.isAdmin, adminController.createBrand);
routes.patch("/brands/:id/unlist", adminAuth.isAdmin, adminController.unlistBrand);
routes.patch("/brands/:id/list", adminAuth.isAdmin, adminController.listBrand);
routes.get("/brands/edit/:id", adminAuth.isAdmin, adminController.loadeditBrand);
routes.put("/brands/edit", adminAuth.isAdmin, adminController.editBrand);

//? [product management]
routes.get("/products", adminAuth.isAdmin, adminController.loadProductList);
routes.get("/add_product", adminAuth.isAdmin, adminController.loadAddProduct);
routes.post("/add_product", adminAuth.isAdmin, upload.array('product_images'), adminController.createProduct);
routes.get("/edit_product/:id", adminAuth.isAdmin, adminController.LoadEditProduct);
routes.put("/edit_product", adminAuth.isAdmin, upload.array('product_images'), adminController.editProduct);
routes.delete("/edit_product/image", adminAuth.isAdmin, adminController.removeImage);
routes.patch("/products/:id/block", adminAuth.isAdmin, adminController.blockProduct);
routes.patch("/products/:id/unblock", adminAuth.isAdmin, adminController.unblockProduct);
 
//? [offer management]
routes.get("/offers", adminAuth.isAdmin, offerController.loadOfferList);
routes.post("/offers/add-offer", adminAuth.isAdmin, offerController.createOffer);
routes.put("/offers/block", adminAuth.isAdmin, offerController.deleteOffer);
routes.put("/offers/list", adminAuth.isAdmin, offerController.listOffer);

//? [coupon management]
routes.get("/coupons", adminAuth.isAdmin, offerController.loadCouponList);
routes.post("/coupons/add-coupon", adminAuth.isAdmin, offerController.createCoupon);
routes.delete("/coupons/delete", adminAuth.isAdmin, offerController.deleteCoupon);

//? [sales report]
routes.get("/sales", adminAuth.isAdmin, salesController.loadSales);
routes.post("/sales", adminAuth.isAdmin, salesController.generateReport);
routes.get('/download-pdf-report', salesController.downloadPDFReport);
routes.get('/download-excel-report', salesController.downloadExcelReport);

//? [review]
routes.get("/reviews", adminAuth.isAdmin, adminController.loadReviews);
routes.get("/reviews/:reviewId", adminAuth.isAdmin, adminController.deleteReview);

//? [banner]
routes.get("/banners", adminAuth.isAdmin, adminController.loadBanner);
routes.post("/banners/create", adminAuth.isAdmin, upload.single('banner_image'), adminController.createBanner);
routes.patch("/banners/remove", adminAuth.isAdmin, adminController.removeBanner);

routes.get("*", (req, res) => {
  res.status(404).render("adminError");
});

module.exports = routes;