const express = require("express");
const router = express.Router();
const clientController = require("../controllers/clientController");

// ================= LIST PAGE =================
router.get("/client", clientController.clientPage);

// ================= PRODUCT VIEW =================
router.get("/client/view/:id", clientController.viewProductPage);

module.exports = router;