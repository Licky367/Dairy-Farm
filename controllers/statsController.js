const statsService = require("../services/statsService");

/* =========================
   FINANCIAL STATS (API)
========================= */
exports.getFinancialStats = async (req, res) => {
    try {
        const { month, year } = req.query;

        const data = await statsService.getFinancialStats({
            month,
            year
        });

        res.json(data);
    } catch (err) {
        console.error("Financial Stats Error:", err);
        res.status(500).json({ message: err.message });
    }
};

/* =========================
   BUILD / REBUILD SNAPSHOT (MANUAL TRIGGER)
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
   CATEGORY STATS (FILTERABLE)
   ?majorCategory=Electronics
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
   PRODUCT STATS (FILTERABLE 🔥)
   ?majorCategory=Electronics
   ?category=Phones
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
   DASHBOARD VIEW (EJS RENDER)
========================= */
exports.renderDashboard = async (req, res) => {
    try {
        const { month, year } = req.query;

        const {
            financial,
            majorCategoryStats,
            categoryStats,
            productStats
        } = await statsService.getDashboardStats({
            month,
            year
        });

        res.render("admin/financial-analytics", {
            financial: {
                ...financial,
                month,
                year
            },
            majorCategoryStats,
            categoryStats,
            productStats
        });

    } catch (err) {
        console.error("Dashboard Render Error:", err);
        res.status(500).send("Server Error");
    }
};

/* =========================
   DASHBOARD SUMMARY (API)
========================= */
exports.getDashboardStats = async (req, res) => {
    try {
        const { month, year } = req.query;

        const data = await statsService.getDashboardStats({
            month,
            year
        });

        res.json(data);
    } catch (err) {
        console.error("Dashboard Stats Error:", err);
        res.status(500).json({ message: err.message });
    }
};