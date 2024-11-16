const cron = require("node-cron");
const moment = require("moment");
const Offer = require("../Models/offerModel");
const Product = require("../Models/productModel");

cron.schedule("0 0 * * *", async () => {
  try {
    const currentDate = moment();

    const expiredOffers = await Offer.find({
      endDate: { $lt: currentDate.toDate() },
    });

    if (expiredOffers.length > 0) {
      const expiredOfferIds = expiredOffers.map((offer) => offer._id);

      await Offer.updateMany(
        { _id: { $in: expiredOfferIds } },
        { $set: { isActive: false } }
      );

      for (const offer of expiredOffers) {
        const query = {};

        if (offer.brands && offer.brands.length > 0) {
          query.brand = { $in: offer.brands.map((brand) => brand._id) };
        }

        if (offer.categories && offer.categories.length > 0) {
          query.category = {
            $in: offer.categories.map((category) => category._id),
          };
        }

        const products = await Product.find(query);

        if (products.length > 0) {
          const bulkOps = products.map((product) => ({
            updateOne: {
              filter: { _id: product._id },
              update: { discount_price: 0 },
            },
          }));
          await Product.bulkWrite(bulkOps);
        }
      }
    }
  } catch (error) {
    console.error("cron schedule:", error.message);
    res.status(500).render("internalError");
  }
});
