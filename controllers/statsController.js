const statsService = require("../services/statsService");

/* =========================
   FINANCIAL STATS (API)
========================= */
exports.getFinancialStats = async (req, res) => {
    try {
        const { month, year, timeMode } = req.query;

        const data = await statsService.getFinancialStats({
            month,
            year,
            timeMode
        });

        res.json(data);

    } catch (err) {
        console.error("Financial Stats Error:", err);
        res.status(500).json({ message: err.message });
    }
};

/* =========================
   BUILD / REBUILD SNAPSHOT
========================= */
exports.buildMonthlyStats = async (req, res) => {
    try {
        const { month, year } = req.query;

        const data = await statsService.buildMonthlyStatistics({
            month,
            year
        });

        res.json({
            message: "Statistics built successfully",
            data
        });

    } catch (err) {
        console.error("Build Stats Error:", err);
        res.status(500).json({ message: err.message });
    }
};

/* =========================
   CATEGORY STATS (API)
========================= */
exports.getCategoryStats = async (req, res) => {
    try {
        const { month, year, majorCategory } = req.query;

        const data = await statsService.getCategoryStats({
            month,
            year,
            majorCategory
        });

        res.json(data);

    } catch (err) {
        console.error("Category Stats Error:", err);
        res.status(500).json({ message: err.message });
    }
};

/* =========================
   PRODUCT STATS (API)
========================= */
exports.getProductStats = async (req, res) => {
    try {
        const { month, year, majorCategory, category } = req.query;

        const data = await statsService.getProductStats({
            month,
            year,
            majorCategory,
            category
        });

        res.json(data);

    } catch (err) {
        console.error("Product Stats Error:", err);
        res.status(500).json({ message: err.message });
    }
};

/* =========================
   DASHBOARD RENDER (EJS)
========================= */
exports.renderDashboard = async (req, res) => {
    try {
        const { month, year, timeMode } = req.query;

        const dashboard = await statsService.getDashboardStats({
            month,
            year,
            timeMode
        });

        res.render("admin/financial-analytics", {
            financial: dashboard.financial,
            majorCategoryStats: dashboard.majorCategoryStats,
            categoryStats: dashboard.categoryStats,
            productStats: dashboard.productStats,
            demandCurves: dashboard.demandCurves || null
        });

    } catch (err) {
        console.error("Dashboard Render Error:", err);
        res.status(500).send("Server Error");
    }
};

/* =========================
   DASHBOARD API
========================= */
exports.getDashboardStats = async (req, res) => {
    try {
        const { month, year, timeMode } = req.query;

        const data = await statsService.getDashboardStats({
            month,
            year,
            timeMode
        });

        res.json(data);

    } catch (err) {
        console.error("Dashboard Stats Error:", err);
        res.status(500).json({ message: err.message });
    }
};