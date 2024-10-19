const mongoose = require("mongoose");

const userAddress = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  mobile: {
    type: [String],
    required: true,
  },
  pincode: {
    type: Number,
    required: true,
  },
  locality: {
    type: String,
    required: false,
  },
  city: {
    type: String,
    required: true,
  },
  state: {
    type: String,
    required: true,
  },
  landmark: {
    type: String,
    required: false,
  },
  type: {
    type: String,
    required: true,
  },
  isDefault: {
    type: Boolean,
    default: false,
  },
});

module.exports = mongoose.model("address", userAddress);
