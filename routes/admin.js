const express = require("express");
const router = express.Router();
const { isAdmin } = require("../middleware/auth");
const adminController = require("../controllers/adminController");

router.get("/admin", isAdmin, adminController.dashboard);
router.get("/admin/orders", isAdmin, adminController.orders);
router.get("/admin/products", isAdmin, adminController.products);

module.exports = router;