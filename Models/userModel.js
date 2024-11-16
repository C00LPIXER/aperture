const mongoose = require("mongoose");
const userAddress = require("./userAddress");

const userSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: true,
  },
  lastName: {
    type: String,
    required: false,
  },
  email: {
    type: String,
    required: true,
    uinique: true,
  },
  password: {
    type: String,
    required: false,
  },
  googleId: {
    type: String,
    uinique: true,
  },
  signUpDate: {
    type: String,
    required: true,
  },
  addresses: {
    type: [mongoose.Schema.Types.ObjectId],
    ref: "address",
    required: false,
  },
  is_blocked: {
    type: Boolean,
    required: true,
    default: false,
  },
  is_admin: {
    type: Boolean,
    required: true,
    default: false,
  },
});

module.exports = mongoose.model("user", userSchema);
