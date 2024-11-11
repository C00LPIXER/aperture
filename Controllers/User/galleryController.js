const Art = require("../../Models/artModel");
const User = require("../../Models/userModel");
require("dotenv").config();

const cloudinary = require("cloudinary").v2;
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const loadShutterSpace = async (req, res) => {
  try {
    const arts = await Art.find().populate("userId")
    res.render("shutterSpace", {arts});
  } catch (error) {
    console.error(error.message);
  }
};

const createArt = async (req, res) => {
  try {
    const userId = req.session.user;
    if(!userId) return res.json({success: false, message: "Please login for shere your art!"});

    const { title, description, camera, lens, aperture, iso, sutter_speed } = req.body;

    const image = req.files && req.files.length > 0 ? req.files[0].path : null;

    if (!image) {
      return res.json({ success: false, message: "Image upload failed" });
    }

    const art = new Art({
      userId,
      image,
      title,
      description,
      camera,
      lens,
      aperture,
      iso,
      sutter_speed,
    });

    await art.save();
    res.json({ success: true, message: "Your art published!" });
  } catch (error) {
    console.error(error.message);
  }
};

const removeArt = async (req, res) => {
  try {
  } catch (error) {
    console.error(error.message);
  }
};

module.exports = {
  loadShutterSpace,
  createArt,
  removeArt,
};
 