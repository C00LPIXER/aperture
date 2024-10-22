const User = require("../../Models/userModel");
const bcrypt = require("bcrypt");
const Address = require("../../Models/userAddress");
const Order = require("../../Models/orderModel");
require("dotenv").config();

//* user profile manegement
const loadProfilePage = async (req, res) => {
  try {
    if (req.session.user) {
      const userId = req.session.user;
      const user = await User.findById(userId).populate("addresses");
      const order = await Order.find({ userId })
        .populate("items.product")
        .populate("shippingAddress");
      if (user) {
        res.render("userProfile", { user, order });
      }
    }
  } catch (error) {
    console.log(error.message);
  }
};

const editUserInfo = async (req, res) => {
  try {
    const { firstName, lastName, id, currentPassword, newPassword } = req.body;
    const userData = await User.findById(id);

    if (currentPassword) {
      const passwdMatch = await bcrypt.compare(
        currentPassword,
        userData.password
      );

      if (passwdMatch) {
        const sPasswd = await securePasswd(newPassword);
        const user = await User.findByIdAndUpdate(id, {
          firstName: firstName,
          lastName: lastName,
          password: sPasswd,
        });
        res.json({
          success: true,
          user,
          message: "Profile updated successfully!",
        });
      } else {
        return res.json({
          success: false,
          message: "Incorrect password. Please try again.",
        });
      }
    } else {
      if (userData.firstName !== firstName || userData.lastName !== lastName) {
        const user = await User.findByIdAndUpdate(id, {
          firstName: firstName,
          lastName: lastName,
        });
        res.json({
          success: true,
          user,
          message: "Name updated successfully!",
        });
      } else {
        res.json({
          success: false,
          message: "Enter current password",
        });
      }
    }
  } catch (error) {
    console.log(error.message);
  }
};

const addAddress = async (req, res) => {
  try {
    const {
      name,
      mobile,
      pincode,
      locality,
      city,
      state,
      landmark,
      secondmobile,
      type,
    } = req.body;
    const userId = req.session.user;

    let numbers = [mobile];
    secondmobile ? numbers.push(secondmobile) : null;

    const newAddress = new Address({
      name,
      mobile: numbers,
      pincode,
      locality,
      city,
      state,
      landmark,
      type,
    });

    const savedAddress = await newAddress.save();

    const user = await User.findById(userId);
    user.addresses.push(savedAddress._id);
    await user.save();

    res.json({
      success: true,
      message: "Address added successfully",
      address: savedAddress,
    });
  } catch (error) {
    console.log(error.message);
  }
};

const editAddress = async (req, res) => {
  try {
    console.log(req.body);
    const {
      addressId,
      name,
      mobile,
      pincode,
      locality,
      city,
      state,
      landmark,
      secondmobile,
      type,
    } = req.body;

    let numbers = [mobile];
    secondmobile ? numbers.push(secondmobile) : null;

    const updatedAddress = await Address.findByIdAndUpdate(
      addressId,
      {
        name,
        mobile: numbers,
        pincode,
        locality,
        city,
        state,
        landmark,
        type,
      }
    );
    if(updatedAddress){
        res.json({success: true, message: "Address updated successfully"});
    }
  } catch (error) {
    console.log(error.message);
  }
};

const removeAddress = async (req, res) => {
  try {
    const addressId = req.body.id;
    const userId = req.session.user;

    const user = await User.findByIdAndUpdate(userId, {
      $pull: { addresses: addressId },
    });

    await Address.findByIdAndDelete(addressId);

    res.json({ success: true, message: "Address removed successfully" });
  } catch (error) {
    console.log(error.message);
  }
};

const loadEditAddress = async (req, res) => {
  try {
    const userId = req.session.user;
    const addressId = req.params.id;
    const user = await User.findById(userId).populate("addresses");
    const address = user.addresses.find(
      (addr) => addr._id.toString() === addressId
    );

    res.render("editAddress", { address });
  } catch (error) {
    console.log(error.message);
  }
};

const addReview = async (req, res) => {
    try {
        console.log(req.body)
        res.json({success: true, message: "Your review has been submitted successfully!"})
    } catch (error) {
        console.log(error.message)
    }
}

module.exports = {
  loadProfilePage,
  editUserInfo,
  removeAddress,
  addAddress,
  editAddress,
  loadEditAddress,
  addReview
};
