const express = require("express");
const router = express.Router();
const checkoutController = require("../controllers/checkoutController");

router.get("/checkout", checkoutController.checkoutPage);
router.post("/checkout", checkoutController.processCheckout);

module.exports = router;