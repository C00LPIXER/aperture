const User = require("../../Models/userModel");
const Category = require("../../Models/categoryModel");
const Brands = require("../../Models/brandsModel");
const Product = require("../../Models/productModel");
const Address = require("../../Models/userAddress");
const Cart = require("../../Models/cartModel");
const Order = require("../../Models/orderModel");
const Wallet = require("../../Models/walletModel");
const bcrypt = require("bcrypt");
const path = require("path");
const fs = require("fs");
const cloudinary = require("cloudinary").v2;
const Offer = require("../../Models/offerModel");
const Review = require("../../Models/reviewModel");
const Banner = require("../../Models/bannerModel");
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

//* admin authentication
const loadAdminPage = async (req, res) => {
  try {
    const orders = await Order.countDocuments();
    const products = await Product.countDocuments();
    const users = await User.countDocuments();
    const totalRevenue = await Order.aggregate([
      {
        $match: {
          orderStatus: "Delivered",
        },
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: "$totalPrice" },
        },
      },
    ]);

    res.render("admin", { orders, products, users, totalRevenue });
  } catch (error) {
    console.error(error.message);
    res.status(500).send("Internal server error");
  }
};

const loadChart = async (req, res) => {
  try {
    const { filter } = req.query;
    let dateGroup, dateRange;

    if (filter === "yearly") {
      dateGroup = { $year: "$placedAt" };
      dateRange = 5;
    } else if (filter === "monthly") {
      dateGroup = { $month: "$placedAt" };
      dateRange = 12;
    } else if (filter === "daily") {
      dateGroup = { $dayOfWeek: "$placedAt" };
      dateRange = 7;
    } else {
      dateGroup = { $month: "$placedAt" };
      dateRange = 12;
    }

    const revenue = await Order.aggregate([
      {
        $match: {
          orderStatus: "Delivered",
          ...(filter === "daily"
            ? {
                placedAt: {
                  $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
                },
              }
            : {}),
        },
      },
      {
        $group: {
          _id: dateGroup,
          totalRevenue: { $sum: "$totalPrice" },
        },
      },
      { $sort: { _id: 1 } },
      { $limit: dateRange },
    ]);

    const topProducts = await Order.aggregate([
      { $match: { orderStatus: "Delivered" } },
      { $unwind: "$items" },
      {
        $group: {
          _id: "$items.product",
          totalQuantity: { $sum: "$items.quantity" },
        },
      },
      {
        $lookup: {
          from: "products",
          localField: "_id",
          foreignField: "_id",
          as: "productDetails",
        },
      },
      { $unwind: "$productDetails" },
      {
        $project: {
          _id: 1,
          totalQuantity: 1,
          productName: "$productDetails.name",
        },
      },
      { $sort: { totalQuantity: -1 } },
      { $limit: 10 },
    ]);

    const topCategories = await Order.aggregate([
      { $match: { orderStatus: "Delivered" } },
      { $unwind: "$items" },
      {
        $lookup: {
          from: "products",
          localField: "items.product",
          foreignField: "_id",
          as: "productInfo",
        },
      },
      { $unwind: "$productInfo" },
      {
        $group: {
          _id: "$productInfo.category",
          totalSales: { $sum: "$items.quantity" },
        },
      },
      {
        $lookup: {
          from: "categories",
          localField: "_id",
          foreignField: "_id",
          as: "categoryDetails",
        },
      },
      { $unwind: "$categoryDetails" },
      {
        $project: {
          _id: 1,
          totalSales: 1,
          categoryName: "$categoryDetails.name",
        },
      },
      { $sort: { totalSales: -1 } },
      { $limit: 10 },
    ]);

    res.json({ revenue, topProducts, topCategories });
  } catch (error) {
    console.error(error.message);
    res.status(500).send("Internal server error");
  }
};

const loadAdminLogin = async (req, res) => {
  try {
    res.render("adminLogin");
  } catch (error) {
    console.error(error.message);
    res.status(500).send("Internal server error");
  }
};

const adminAuthentication = async (req, res) => {
  try {
    const email = req.body.email;
    const password = req.body.password;
    const userData = await User.findOne({ email: email, is_admin: true });

    if (userData) {
      if (!userData.password) {
        return res.json({
          success: false,
          message: "Invalid credentials, please try again.",
        });
      }

      const passwdMatch = await bcrypt.compare(password, userData.password);
      if (passwdMatch) {
        req.session.admin = userData.email;
        return res.json({ success: true });
      } else {
        return res.json({
          success: false,
          message: "Incorrect password. Please try again.",
        });
      }
    } else {
      return res.json({
        success: false,
        message: "Only admin can login.",
      });
    }
  } catch (error) {
    console.error(error.message);
    res.status(500).send("Internal server error");
  }
};

const adminLogout = async (req, res) => {
  try {
    req.session.admin = null;
    res.redirect("/admin/login");
  } catch (error) {
    console.error(error.message);
    res.status(500).send("Internal server error");
  }
};

//* product manegement
const loadProductList = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 4;
    const products = await Product.find()
      .populate("category", "name")
      .populate("brand", "name")
      .skip((page - 1) * limit)
      .limit(limit);
    const categories = await Category.find();
    const brands = await Brands.find();

    const totalProducts = await Product.countDocuments();

    res.render("products", {
      products,
      categories,
      brands,
      currentPage: page,
      totalPages: Math.ceil(totalProducts / limit),
      limit,
    });
  } catch (error) {
    console.error(error.message);
    res.status(500).send("Internal server error");
  }
};

const blockProduct = async (req, res) => {
  try {
    const productId = req.params.id;
    await Product.findByIdAndUpdate(productId, { is_Active: false });
    res.json({ success: true, message: "Product blocked", status: "blocked" });
  } catch (error) {
    console.error(error.message);
    res.status(500).send("Internal server error");
  }
};

const unblockProduct = async (req, res) => {
  try {
    const productId = req.params.id;
    await Product.findByIdAndUpdate(productId, { is_Active: true });
    res.json({ success: true, message: "Product unblocked", status: "active" });
  } catch (error) {
    console.error(error.message);
    res.status(500).send("Internal server error");
  }
};

const loadAddProduct = async (req, res) => {
  try {
    const categories = await Category.find();
    const brands = await Brands.find();
    res.render("add_product", { categories, brands });
  } catch (error) {
    console.error(error.message);
    res.status(500).send("Internal server error");
  }
};

const createProduct = async (req, res) => {
  try {
    const isExist = await Product.findOne({ name: req.body.name });

    if (isExist) {
      return res.json({ success: false, message: "Product already exists!" });
    } else {
      const imagePaths = req.files ? req.files.map((file) => file.path) : [];

      const highlight = req.body.highlights.split(",");

      const product = new Product({
        name: req.body.name,
        description: req.body.description,
        price: req.body.price,
        discount_price: req.body.discount_price || 0,
        category: req.body.category,
        brand: req.body.brands,
        stock: req.body.stock,
        images: imagePaths,
        highlights: highlight,
      });

      await product.save();
      return res.json({ success: true, message: "New product added!" });
    }
  } catch (error) {
    console.error(error.message);
    res.status(500).send("Internal server error");
  }
};

const LoadEditProduct = async (req, res) => {
  try {
    const categories = await Category.find();
    const brands = await Brands.find();
    const productId = req.params.id;
    const product = await Product.findById(productId)
      .populate("category", "name")
      .populate("brand", "name");
    res.render("editProduct", { product, categories, brands });
  } catch (error) {
    console.error(error.message);
    res.status(500).send("Internal server error");
  }
};

const removeImage = async (req, res) => {
  try {
    const { imgid, id } = req.body;

    const publicId = imgid
      .replace(
        /^https?:\/\/res\.cloudinary\.com\/[^/]+\/image\/upload\/v\d+\//,
        ""
      )
      .replace(/\.[^.]+$/, "");

    const result = await cloudinary.uploader.destroy(publicId);

    if (result.result === "ok") {
      await Product.findByIdAndUpdate(id, {
        $pull: { images: imgid },
      });
      res.json({ success: true, message: "Image removed successfully!" });
    } else {
      res.json({
        success: false,
        message: "Failed to delete image on Cloudinary.",
      });
    }
  } catch (error) {
    console.error(error.message);
    res.status(500).send("Internal server error");
  }
};

const editProduct = async (req, res) => {
  try {
    const id = req.body.id;
    const highlight = req.body.highlights.split(",");

    const imagePaths = req.files ? req.files.map((file) => file.path) : [];

    const product = await Product.findById(id);

    const updatedImages = [...product.images, ...imagePaths];

    if (updatedImages.length < 3) {
      return res.json({ success: false, message: "minimum add 3 images" });
    }

    await Product.findByIdAndUpdate(id, {
      name: req.body.name,
      description: req.body.description,
      price: req.body.price,
      discount_price: req.body.discount_price || 0,
      category: req.body.category,
      brand: req.body.brands,
      stock: req.body.stock,
      highlights: highlight,
      images: updatedImages,
    });

    res.json({ success: true, message: "Product updated successfully!" });
  } catch (error) {
    console.error(error.message);
    res.status(500).send("Internal server error");
  }
};

//* order manegement
const loadOrderDetail = async (req, res) => {
  try {
    const orderId = req.params.id;
    const userId = req.session.user;
    const order = await Order.findById({ _id: orderId })
      .populate("items.product")
      .populate("userId")
      .populate("shippingAddress");
    res.render("orderDetail", { order });
  } catch (error) {
    console.error(error.message);
    res.status(500).send("Internal server error");
  }
};

const loadOrderList = async (req, res) => {
  try {
    const search = req.query.search || "";
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 4;

    const totalOrders = await Order.countDocuments();
    const orders = await Order.find()
      .populate("items.product")
      .populate("userId")
      .sort({ placedAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    res.render("orders", {
      orders,
      currentPage: page,
      totalPages: Math.ceil(totalOrders / limit),
      limit,
    });
  } catch (error) {
    console.error(error.message);
    res.status(500).send("Internal server error");
  }
};

const changeOrderStatus = async (req, res) => {
  try {
    const { orderId, status } = req.body;
    const userId = req.session.user;

    const order = await Order.findById(orderId);
    const amount = order.totalPrice;

    if (status === "Cancelled" && order.orderStatus !== "Cancelled") {
      for (let item of order.items) {
        await Product.findByIdAndUpdate(item.product, {
          $inc: { stock: item.quantity },
        });
      }

      if (
        order.paymentMethod === "Wallet" ||
        order.paymentMethod === "PayPal"
      ) {
        const wallet = await Wallet.findOne({ userId: userId });
        if (wallet) {
          wallet.balance += amount;
          wallet.walletHistory.push({
            transactionType: "credit",
            amount: amount,
            description: "Refund",
          });
          await wallet.save();
        } else {
          const newWallet = new Wallet({
            userId,
            balance: amount,
            walletHistory: [
              {
                transactionType: "credit",
                amount: amount,
                description: "Refund",
              },
            ],
          });
          await newWallet.save();
        }
      }
    }

    order.orderStatus = status;
    await order.save();

    res.json({ success: true, message: `Oreder ststus changed to ${status}` });
  } catch (error) {
    console.error(error.message);
    res.status(500).send("Internal server error");
  }
};

//* User manegement
const loadUserList = async (req, res) => {
  const search = req.query.search || "";
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 4;

  try {
    let users = await User.find()
      .skip((page - 1) * limit)
      .limit(limit);

    const totalUsers = await User.countDocuments();
    const query = req.query.user;

    if (query) {
      users = await User.find({
        $or: [
          { firstName: { $regex: query, $options: "i" } },
          { lastName: { $regex: query, $options: "i" } },
          { email: { $regex: query, $options: "i" } },
        ],
      });
    }

    res.render("users", {
      users,
      currentPage: page,
      totalPages: Math.ceil(totalUsers / limit),
      limit,
    });
  } catch (error) {
    console.error(error.message);
    res.status(500).send("Internal server error");
  }
};

const blockUser = async (req, res) => {
  try {
    const userId = req.params.id;
    await User.findByIdAndUpdate(userId, { is_blocked: true });
    res.json({ success: true, message: "User blocked", status: "blocked" });
  } catch (error) {
    console.error(error.message);
    res.status(500).send("Internal server error");
  }
};

const unblockUser = async (req, res) => {
  try {
    const userId = req.params.id;
    await User.findByIdAndUpdate(userId, { is_blocked: false });
    res.json({ success: true, message: "User unblocked", status: "active" });
  } catch (error) {
    console.error(error.message);
    res.status(500).send("Internal server error");
  }
};

//* category manegement
const loadCategoryPage = async (req, res) => {
  try {
    const categories = await Category.find();
    res.render("categories", { categories });
  } catch (error) {
    console.error(error.message);
    res.status(500).send("Internal server error");
  }
};

const createCategory = async (req, res) => {
  try {
    const isExist = await Category.findOne({ name: req.body.name });
    if (isExist) {
      return res.json({ success: false, message: "Category already exists!" });
    } else {
      const category = new Category({
        name: req.body.name,
        description: req.body.description,
      });
      await category.save();
      return res.json({ success: true, message: "New category created!" });
    }
  } catch (error) {
    console.error(error.message);
    res.status(500).send("Internal server error");
  }
};

const listCategory = async (req, res) => {
  try {
    const userId = req.params.id;
    await Category.findByIdAndUpdate(userId, { is_Active: true });
    res.json({ success: true, message: "Category listed successfully" });
  } catch (error) {
    console.error(error.message);
    res.status(500).send("Internal server error");
  }
};

const unlistCategory = async (req, res) => {
  try {
    const userId = req.params.id;
    await Category.findByIdAndUpdate(userId, { is_Active: false });
    res.json({ success: true, message: "Category Unlisted successfully" });
  } catch (error) {
    console.error(error.message);
    res.status(500).send("Internal server error");
  }
};

const loadEditCategory = async (req, res) => {
  try {
    const categoryId = req.params.id;
    const category = await Category.findById(categoryId);

    res.render("editCategory", { category });
  } catch (error) {
    console.error(error.message);
    res.status(500).send("Internal server error");
  }
};

const editCategory = async (req, res) => {
  try {
    const { id, name, description } = req.body;
    const category = await Category.findById(id);
    const isExist = await Category.findOne({
      name: { $regex: new RegExp(req.body.name, "i") },
    });

    if (isExist && category.name !== req.body.name) {
      return res.json({ success: false, message: "Category already exists!" });
    } else {
      await Category.findByIdAndUpdate(id, {
        name: name,
        description: description,
      });
      res.json({ success: true, message: "Category updated successfully!" });
    }
  } catch (error) {
    console.error(error.message);
    res.status(500).send("Internal server error");
  }
};

//* brand manegement
const loadBrandPage = async (req, res) => {
  try {
    const brands = await Brands.find();
    res.render("brands", { brands });
  } catch (error) {
    console.error(error.message);
    res.status(500).send("Internal server error");
  }
};

const createBrand = async (req, res) => {
  try {
    const isExist = await Brands.findOne({ name: req.body.name });
    if (isExist) {
      return res.json({ success: false, message: "Brand already exists!" });
    } else {
      const brand = new Brands({
        name: req.body.name,
        description: req.body.description,
      });
      await brand.save();
      return res.json({ success: true, message: "New Brand added!" });
    }
  } catch (error) {
    console.error(error.message);
    res.status(500).send("Internal server error");
  }
};

const listBrand = async (req, res) => {
  try {
    const userId = req.params.id;
    await Brands.findByIdAndUpdate(userId, { is_Active: true });
    return res.json({ success: true, message: "Brand listed successfully" });
  } catch (error) {
    console.error(error.message);
    res.status(500).send("Internal server error");
  }
};

const unlistBrand = async (req, res) => {
  try {
    const userId = req.params.id;
    await Brands.findByIdAndUpdate(userId, { is_Active: false });
    return res.json({ success: true, message: "Brand Unlisted successfully" });
  } catch (error) {
    console.error(error.message);
    res.status(500).send("Internal server error");
  }
};

const loadeditBrand = async (req, res) => {
  try {
    const brandId = req.params.id;
    const brand = await Brands.findById(brandId);

    res.render("editBrand", { brand });
  } catch (error) {
    console.error(error.message);
    res.status(500).send("Internal server error");
  }
};

const editBrand = async (req, res) => {
  try {
    const { id, name, description } = req.body;
    const brand = await Brands.findById(id);
    const isExist = await Brands.findOne({
      name: { $regex: new RegExp(req.body.name, "i") },
    });

    if (isExist && brand.name !== req.body.name) {
      return res.json({ success: false, message: "Category already exists!" });
    } else {
      await Brands.findByIdAndUpdate(id, {
        name: name,
        description: description,
      });
      res.json({ success: true, message: "Brand updated successfully!" });
    }
  } catch (error) {
    console.error(error.message);
    res.status(500).send("Internal server error");
  }
};

//* review manegement
const loadReviews = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 4;
    const skip = (page - 1) * limit;

    const reviews = await Review.find()
      .populate("productId")
      .skip(skip)
      .limit(limit);

    const totalReviews = await Review.countDocuments();
    const totalPages = Math.ceil(totalReviews / limit);

    res.render("reviews", {
      reviews,
      currentPage: page,
      totalPages,
      limit,
    });
  } catch (error) {
    console.error(error.message);
    res.status(500).send("Internal server error");
  }
};

const deleteReview = async (req, res) => {
  try {
    const reviewId = req.params.reviewId;
    await Review.findByIdAndDelete(reviewId);

    res.json({ success: true, message: "Review removed!" });
  } catch (error) {
    console.error(error.message);
    res.status(500).send("Internal server error");
  }
};

//* banner manegement
const loadBanner = async (req, res) => {
  try {
    const banners = await Banner.find();
    res.render("banners", { banners });
  } catch (error) {
    console.error(error.message);
    res.status(500).send("Internal server error");
  }
};

const createBanner = async (req, res) => {
  try {
    const title = req.body.title;
    const subTitle = req.body.subtitle;
    const image = req.file.path;

    const banner = new Banner({
      title,
      subTitle,
      image,
    }).save();
    res.json({success: true, message: "New banner added"})
  } catch (error) {
    console.error(error.message);
    res.status(500).send("Internal server error");
  }
};

module.exports = {
  loadAdminPage,
  loadAdminLogin,
  adminAuthentication,
  loadUserList,
  loadProductList,
  loadOrderDetail,
  loadOrderList,
  blockUser,
  unblockUser,
  loadCategoryPage,
  createCategory,
  loadAddProduct,
  listCategory,
  unlistCategory,
  loadBrandPage,
  createBrand,
  listBrand,
  unlistBrand,
  createProduct,
  unblockProduct,
  blockProduct,
  LoadEditProduct,
  loadEditCategory,
  editCategory,
  loadeditBrand,
  editBrand,
  editProduct,
  removeImage,
  adminLogout,
  changeOrderStatus,
  loadChart,
  loadReviews,
  deleteReview,
  loadBanner,
  createBanner,
};
