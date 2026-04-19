const express = require("express");
const router = express.Router();

const checkoutController =
require("../controllers/checkoutController");

// checkout page
router.get(
"/checkout",
checkoutController.checkoutPage
);

// create order + payment
router.post(
"/checkout",
checkoutController.processCheckout
);

module.exports = router;