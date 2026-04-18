const express = require("express");
const router = express.Router();
const adminController = require("../controllers/adminController");
const upload = require("../middleware/upload");
const { isAdmin } = require("../middleware/auth");

router.get("/admin", isAdmin, adminController.dashboard);

router.get("/admin/products", isAdmin, adminController.products);

router.get("/admin/products/edit/:id", isAdmin, adminController.editProductPage);

router.post(
    "/admin/products/update/:id",
    isAdmin,
    upload.single("image"),
    adminController.updateProduct
);

module.exports = router;