const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: true,
  },
  lastName: {
    type: String,
    required: true,
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
