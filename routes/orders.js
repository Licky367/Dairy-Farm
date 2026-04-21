const express = require("express");
const router = express.Router();

const ordersController = require("../controllers/orders");

// GET admin orders page
router.get("/", ordersController.getAllOrders);

// MARK CASH PAYMENT
router.post("/:id/pay", ordersController.markAsPaidCash);

// MARK DELIVERY
router.post("/:id/deliver", ordersController.markAsDelivered);

module.exports = router;