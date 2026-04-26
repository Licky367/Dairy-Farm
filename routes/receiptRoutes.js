const express = require("express");
const router = express.Router();
const receiptController = require("../controllers/receiptController");

// ADMIN
router.get(
    "/admin/orders/:id/receipt",
    receiptController.downloadReceiptAdmin
);

// CLIENT
router.get(
    "/client/orders/:id/receipt",
    receiptController.downloadReceiptClient
);

module.exports = router;