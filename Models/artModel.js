const mongoose = require("mongoose");

const artSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "user",
    required: true,
  },
  image: {
    type: String,
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  camera: {
    type: String,
    required: true,
  },
  lens: {
    type: String,
    required: true,
  },
  aperture: {
    type: String,
    required: true,
  },
  iso: {
    type: String,
    required: true,
  },
  sutter_speed: {
    type: String,
    required: true,
  },
});

module.exports = mongoose.model("art", artSchema);
