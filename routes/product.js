const express = require("express");
const router = express.Router();
const productController = require("../controllers/productController");

router.get("/product/:id", productController.productDetails);

module.exports = router;