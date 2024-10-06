const mongoose = require("mongoose");

const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  discription: {
    type: String,
    required: true,
  },
  is_Active: {
    type: Boolean,
    required: true,
    default: true,
  },
});

module.exports = mongoose.model("categories", categorySchema);
