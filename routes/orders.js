const express = require("express");
const router = express.Router();

const ordersController = require("../controllers/ordersController");

/* ================= ADMIN ORDERS LIST ================= */
router.get("/admin/orders", ordersController.getAllOrders);

/* ================= ADMIN ORDER DETAILS ================= */
router.get("/admin/orders/:id", ordersController.getOrderDetails);

/* ================= MARK AS PAID (CASH) ================= */
router.post("/admin/orders/:id/pay", ordersController.markAsPaidCash);

/* ================= MARK AS DELIVERED ================= */
router.post("/admin/orders/:id/deliver", ordersController.markAsDelivered);

module.exports = router;