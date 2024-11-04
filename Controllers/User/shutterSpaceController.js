const loadShutterSpace = async (req, res) => {
  try {
    res.render("shutterSpace");
  } catch (error) {
    console.error(error.message);
  }
};

const createArt = async (req, res) => {
  try {
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
