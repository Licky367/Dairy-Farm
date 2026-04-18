const express = require("express");
const router = express.Router();
const { isAdmin } = require("../middleware/auth");
const adminController = require("../controllers/adminController");

// dashboard
router.get("/admin", isAdmin, adminController.dashboard);

// products list
router.get("/admin/products", isAdmin, adminController.products);

// edit product page
router.get("/admin/products/edit/:id", isAdmin, adminController.editProductPage);

// update product
router.post("/admin/products/update/:id", isAdmin, adminController.updateProduct);

module.exports = router;