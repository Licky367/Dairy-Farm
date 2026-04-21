const express = require("express");
const router = express.Router();

const paymentController = require("../controllers/paymentController");

/* =========================
   PAYMENT PAGE (NEW ADDITION)
========================= */
router.get(
    "/payment-page/:orderId",
    paymentController.paymentPage
);

/* =========================
   INITIATE PAYMENT (M-PESA)
========================= */
router.post(
    "/payment/initiate",
    paymentController.initiatePayment
);

/* =========================
   M-PESA CALLBACK
========================= */
router.post(
    "/mpesa/callback",
    paymentController.mpesaCallback
);

module.exports = router;