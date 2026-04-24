const express = require("express");
const router = express.Router();
const categoryController = require("../controllers/categoryController");

/* VIEW ALL CATEGORIES */
router.get("/", categoryController.getCategories);

/* CREATE CATEGORY PAGE */
router.get("/create", categoryController.getCreatePage);

/* CREATE CATEGORY */
router.post("/create", categoryController.createCategory);

/* RESTOCK CATEGORY */
router.post("/restock", categoryController.restockCategory);

module.exports = router;