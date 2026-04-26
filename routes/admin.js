// routes/admin.js

const express = require("express");
const router = express.Router();
const adminController = require("../controllers/adminController");
const upload = require("../middleware/upload");
const { isAdmin } = require("../middleware/auth");

// Dashboard
router.get("/admin/dashboard", isAdmin, adminController.dashboard);

// Products List
router.get("/admin/products", isAdmin, adminController.products);

// Create Product
router.get("/admin/products/create", isAdmin, adminController.createProductPage);

router.post(
  "/admin/products/create",
  isAdmin,
  upload.single("image"),
  adminController.createProduct
);

// Edit Product
router.get(
  "/admin/products/edit/:id",
  isAdmin,
  adminController.editProductPage
);

router.post(
  "/admin/products/update/:id",
  isAdmin,
  upload.single("image"),
  adminController.updateProduct
);

// Delete Product
router.post(
  "/admin/products/delete/:id",
  isAdmin,
  adminController.deleteProduct
);

module.exports = router;