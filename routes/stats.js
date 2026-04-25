const express = require("express");
const router = express.Router();
const statsController = require("../controllers/statsController");

/* =========================
   FINANCIAL ANALYTICS
========================= */
router.get("/financial", statsController.getFinancialStats);

/* =========================
   SNAPSHOT BUILDER (MANUAL TRIGGER)
========================= */
router.post("/build", statsController.buildMonthlyStats);

/* =========================
   CATEGORY BREAKDOWN
========================= */
router.get("/categories", statsController.getCategoryStats);

/* =========================
   PRODUCT PERFORMANCE
========================= */
router.get("/products", statsController.getProductStats);

/* =========================
   DASHBOARD SUMMARY
========================= */
router.get("/dashboard", statsController.getDashboardStats);

module.exports = router;