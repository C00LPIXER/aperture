const loadShutterSpace = async (req, res) => {
  try {
    res.render("shutterSpace");
  } catch (error) {
    console.error(error.message);
  }
};

module.exports = {
    loadShutterSpace
}