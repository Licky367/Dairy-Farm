const express =
require("express");

const router =
express.Router();

const paymentController =
require(
"../controllers/paymentController"
);

/* initiate */
router.post(
"/payment/initiate",
paymentController
.initiatePayment
);

/* callback */
router.post(
"/mpesa/callback",
paymentController
.mpesaCallback
);

module.exports =
router;