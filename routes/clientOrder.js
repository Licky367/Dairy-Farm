const express = require("express");
const router = express.Router();

const clientOrderController = require("../controllers/clientOrderController");

// 📄 list orders
router.get("/orders", clientOrderController.getUserOrders);

// 📄 single order details
router.get("/orders/:id", clientOrderController.getOrderDetails);

// ✏️ update delivery info
router.post("/orders/update/:id", clientOrderController.updateDeliveryInfo);

module.exports = router;