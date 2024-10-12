const mongoose = require("mongoose");

const brandsSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  is_Active: {
    type: Boolean,
    required: true,
    default: true,
  },
});

module.exports = mongoose.model("brands", brandsSchema);
