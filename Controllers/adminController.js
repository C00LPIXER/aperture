const User = require("../Modals/userModal");
const Category = require("../Modals/categoryModal");
const Brands = require("../Modals/brandsModal");
const Product = require("../Modals/productModal");

const loadAdminPage = async (req, res) => {
  try {
    res.render("admin");
  } catch (error) {
    console.log(error.message);
  }
};

const loadProductList = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 4;
    const products = await Product.find().populate("category", "name").populate("brand", "name")
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
    console.log(error.message);
  }
};

const blockProduct = async (req, res) => {
  try {
    const productId = req.params.id;
    await Product.findByIdAndUpdate(productId, { is_Active: false });
    req.session.user = null;
    res.json({ success: true, message: "Product blocked", status: "blocked" });
  } catch (error) {
    console.log(error.message);
  }
};

const unblockProduct = async (req, res) => {
  try {
    const productId = req.params.id;
    await Product.findByIdAndUpdate(productId, { is_Active: true });
    res.json({ success: true, message: "Product unblocked", status: "active" });
  } catch (error) {
    console.log(error.message);
  }
};

const loadOrderDetail = async (req, res) => {
  try {
    res.render("orderDetail");
  } catch (error) {
    console.log(error.message);
  }
};

const loadOrderList = async (req, res) => {
  try {
    res.render("orders");
  } catch (error) {
    console.log(error.message);
  }
};

const loadUserList = async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 4;

  try {
    const users = await User.find()
      .skip((page - 1) * limit)
      .limit(limit);

    const totalUsers = await User.countDocuments();

    res.render("users", {
      users,
      currentPage: page,
      totalPages: Math.ceil(totalUsers / limit),
      limit,
    });
  } catch (error) {
    console.log(error.message);
  }
};

const blockUser = async (req, res) => {
  try {
    const userId = req.params.id;
    await User.findByIdAndUpdate(userId, { is_blocked: true });
    req.session.user = null;
    res.json({ success: true, message: "User blocked", status: "blocked" });
  } catch (error) {
    console.log(error.message);
  }
};

const unblockUser = async (req, res) => {
  try {
    const userId = req.params.id;
    await User.findByIdAndUpdate(userId, { is_blocked: false });
    res.json({ success: true, message: "User unblocked", status: "active" });
  } catch (error) {
    console.log(error.message);
  }
};

const loadCategoryPage = async (req, res) => {
  try {
    const categories = await Category.find();
    res.render("categories", { categories });
  } catch (error) {
    console.log(error.message);
  }
};

const createCategory = async (req, res) => {
  try {
    console.log(req.body);
    const isExist = await Category.findOne({ name: req.body.name });
    if (isExist) {
      return res.json({ success: false, message: "Category already exists!" });
    } else {
      const user = new Category({
        name: req.body.name,
        discription: req.body.discription,
      });
      await user.save();
      return res.json({ success: true, message: "New category created!" });
    }
  } catch (error) {
    console.log(error.message);
  }
};

const listCategory = async (req, res) => {
  try {
    const userId = req.params.id;
    console.log(userId);
    await Category.findByIdAndUpdate(userId, { is_Active: true });
    res.json({ success: true, message: 'Category listed successfully' });
  } catch (error) {
    console.log(error.message);
  }
};

const unlistCategory = async (req, res) => {
  try {
    const userId = req.params.id;
    await Category.findByIdAndUpdate(userId, { is_Active: false });
    res.json({ success: true, message: 'Category Unlisted successfully' });
  } catch (error) {
    console.log(error.message);
  }
};

const loadBrandPage = async (req, res) => {
  try {
    const brands = await Brands.find();
    res.render("brands", { brands });
  } catch (error) {
    console.log(error.message);
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
        discription: req.body.discription,
      });
      await brand.save();
      return res.json({ success: true, message: "New Brand added!" });
    }
  } catch (error) {
    console.log(error.message);
  }
};

const listBrand = async (req, res) => {
  try {
    const userId = req.params.id;
    console.log(userId);
    await Brands.findByIdAndUpdate(userId, { is_Active: true });
    return res.json({ success: true, message: "Brand already exists!" });
  } catch (error) {
    console.log(error.message);
  }
};

const unlistBrand = async (req, res) => {
  try {
    const userId = req.params.id;
    console.log(userId);
    await Brands.findByIdAndUpdate(userId, { is_Active: false });
    return res.json({ success: true, message: "Brand already exists!" });
  } catch (error) {
    console.log(error.message);
  }
};

const loadAddProduct = async (req, res) => {
  try {
    const categories = await Category.find();
    const brands = await Brands.find();
    res.render("add_product", { categories, brands });
  } catch (error) {
    console.log(error.message);
  }
};

const createProduct = async (req, res) => {
  try {
    console.log(req.body);

    const isExist = await Product.findOne({ name: req.body.name });

    if (isExist) {
      return res.json({ success: false, message: "Product already exists!" });
    }else{

    const imagePaths = req.files
      ? req.files.map((file) => `/uploads/${file.filename}`)
      : [];
    const highlight = req.body.highlights.split(",");

    const product = new Product({
      name: req.body.name,
      description: req.body.description,
      price: req.body.price,
      promotional_price: req.body.orginal_price,
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
    console.log(error.message);
  }
};

module.exports = {
  loadAdminPage,
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
};
