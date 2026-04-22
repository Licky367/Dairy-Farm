const express = require("express");
const router = express.Router();

const controller = require("../controllers/unpaidDeliveredOrdersController");

/* ================= ADMIN VIEW ================= */
router.get(
    "/admin/orders/unpaid-delivered",
    controller.getAdminUnpaidDeliveredOrders
);

/* ================= CLIENT VIEW ================= */
router.get(
    "/client/orders/unpaid-delivered",
    controller.getClientUnpaidDeliveredOrders
);

module.exports = router;