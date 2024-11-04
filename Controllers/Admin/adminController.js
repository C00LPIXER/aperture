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
const Offer = require("../../Models/offerModel");

//* admin authentication
const loadAdminPage = async (req, res) => {
  try {
    res.render("admin");
  } catch (error) {
    console.error(error.message);
  }
};

const loadChart = async (req, res) => {
  try {
    const topCategories = await Order.aggregate([
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
      { $sort: { totalSales: -1 } },
      { $limit: 10 },
    ]);

    const topProducts = await Order.aggregate([
      { $unwind: "$items" },
      {
        $group: {
          _id: "$items.product",
          totalQuantity: { $sum: "$items.quantity" },
          totalSales: {
            $sum: { $multiply: ["$items.quantity", "$items.price"] },
          },
        },
      },
      { $sort: { totalQuantity: -1 } },
      { $limit: 10 },
    ]);

    const revenue = await Order.aggregate([
      {
        $group: {
          _id: { $month: "$placedAt" },
          totalRevenue: { $sum: "$totalPrice" },
        },
      },
      { $sort: { _id: 1 } },
    ]);
    res.json(revenue, topProducts, topCategories);
    console.log(
      "revenue",
      revenue,
      ",topProducts",
      topProducts,
      ",topCategories",
      topCategories
    );
  } catch (error) {
    console.error(error.message);
  }
};

const loadAdminLogin = async (req, res) => {
  try {
    res.render("adminLogin");
  } catch (error) {
    console.error(error.message);
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
  }
};

const adminLogout = async (req, res) => {
  try {
    req.session.admin = null;
    res.redirect("/admin/login");
  } catch (error) {
    console.error(error.message);
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
  }
};

const blockProduct = async (req, res) => {
  try {
    const productId = req.params.id;
    await Product.findByIdAndUpdate(productId, { is_Active: false });
    req.session.user = null;
    res.json({ success: true, message: "Product blocked", status: "blocked" });
  } catch (error) {
    console.error(error.message);
  }
};

const unblockProduct = async (req, res) => {
  try {
    const productId = req.params.id;
    await Product.findByIdAndUpdate(productId, { is_Active: true });
    res.json({ success: true, message: "Product unblocked", status: "active" });
  } catch (error) {
    console.error(error.message);
  }
};

const loadAddProduct = async (req, res) => {
  try {
    const categories = await Category.find();
    const brands = await Brands.find();
    res.render("add_product", { categories, brands });
  } catch (error) {
    console.error(error.message);
  }
};

const createProduct = async (req, res) => {
  try {
    console.log(req.body);
    const isExist = await Product.findOne({ name: req.body.name });

    if (isExist) {
      return res.json({ success: false, message: "Product already exists!" });
    } else {
      const imagePaths = req.files
        ? req.files.map((file) => `/uploads/${file.filename}`)
        : [];
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
  }
};

const removeImage = async (req, res) => {
  try {
    const { imgid, id } = req.body;

    const product = await Product.findByIdAndUpdate(id, {
      $pull: { images: imgid },
    });

    const imagePath = path.join("public", imgid);

    if (fs.existsSync(imagePath)) {
      await fs.unlinkSync(imagePath);
    } else {
      console.log(`Image ${imgid} not found at path: ${imagePath}`);
    }

    res.json({ success: true, message: "Image removed successfully!" });
  } catch (error) {
    console.error(error.message);
  }
};

const editProduct = async (req, res) => {
  try {
    const id = req.body.id;
    const highlight = req.body.highlights.split(",");

    const imagePaths =
      req.files && req.files.length > 0
        ? req.files.map((file) => `/uploads/${file.filename}`)
        : [];

    const product = await Product.findById(id);

    const updatedImages = [...product.images, ...imagePaths];

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
  }
};

const blockUser = async (req, res) => {
  try {
    const userId = req.params.id;
    await User.findByIdAndUpdate(userId, { is_blocked: true });
    res.json({ success: true, message: "User blocked", status: "blocked" });
  } catch (error) {
    console.error(error.message);
  }
};

const unblockUser = async (req, res) => {
  try {
    const userId = req.params.id;
    await User.findByIdAndUpdate(userId, { is_blocked: false });
    res.json({ success: true, message: "User unblocked", status: "active" });
  } catch (error) {
    console.error(error.message);
  }
};

//* category manegement
const loadCategoryPage = async (req, res) => {
  try {
    const categories = await Category.find();
    res.render("categories", { categories });
  } catch (error) {
    console.error(error.message);
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
  }
};

const listCategory = async (req, res) => {
  try {
    const userId = req.params.id;
    await Category.findByIdAndUpdate(userId, { is_Active: true });
    res.json({ success: true, message: "Category listed successfully" });
  } catch (error) {
    console.error(error.message);
  }
};

const unlistCategory = async (req, res) => {
  try {
    const userId = req.params.id;
    await Category.findByIdAndUpdate(userId, { is_Active: false });
    res.json({ success: true, message: "Category Unlisted successfully" });
  } catch (error) {
    console.error(error.message);
  }
};

const loadEditCategory = async (req, res) => {
  try {
    const categoryId = req.params.id;
    const category = await Category.findById(categoryId);

    res.render("editCategory", { category });
  } catch (error) {
    console.error(error.message);
  }
};

const editCategory = async (req, res) => {
  try {
    const { id, name, description } = req.body;
    const category = await Category.findById(id);
    const isExist = await Category.findOne({
      name: { $regex: new RegExp(req.body.name, "i") },
    });
    console.log("from database", category.name, "form body", req.body.name);

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
  }
};

//* brand manegement
const loadBrandPage = async (req, res) => {
  try {
    const brands = await Brands.find();
    res.render("brands", { brands });
  } catch (error) {
    console.error(error.message);
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
  }
};

const listBrand = async (req, res) => {
  try {
    const userId = req.params.id;
    console.log(userId);
    await Brands.findByIdAndUpdate(userId, { is_Active: true });
    return res.json({ success: true, message: "Brand listed successfully" });
  } catch (error) {
    console.error(error.message);
  }
};

const unlistBrand = async (req, res) => {
  try {
    const userId = req.params.id;
    console.log(userId);
    await Brands.findByIdAndUpdate(userId, { is_Active: false });
    return res.json({ success: true, message: "Brand Unlisted successfully" });
  } catch (error) {
    console.error(error.message);
  }
};

const loadeditBrand = async (req, res) => {
  try {
    const brandId = req.params.id;
    const brand = await Brands.findById(brandId);

    res.render("editBrand", { brand });
  } catch (error) {
    console.error(error.message);
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
};
