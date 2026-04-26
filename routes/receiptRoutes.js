// routes/receiptRoutes.js
const express = require("express");
const router = express.Router();
const receiptController = require("../controllers/receiptController");

router.get("/orders/:id/receipt", receiptController.downloadReceipt);

module.exports = router;