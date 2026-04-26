const express = require("express");
const router = express.Router();
const statsController = require("../controllers/statsController");

router.get("/stats", statsController.renderDashboard);

router.get("/financial-stats", statsController.getFinancialStats);
router.get("/category-stats", statsController.getCategoryStats);
router.get("/product-stats", statsController.getProductStats);
router.get("/dashboard-stats", statsController.getDashboardStats);

// optional
router.get("/build-stats", statsController.buildMonthlyStats);

module.exports = router;