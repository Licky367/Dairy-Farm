const statsService = require("../services/statsService");

/* =========================
   FINANCIAL STATS
========================= */
exports.getFinancialStats = async (req, res) => {
    try {
        const data = await statsService.getFinancialStats(req.query);
        res.json(data);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

/* =========================
   BUILD SNAPSHOT
========================= */
exports.buildMonthlyStats = async (req, res) => {
    try {
        const data = await statsService.buildMonthlyStatistics(req.body);
        res.json(data);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

/* =========================
   CATEGORY STATS
========================= */
exports.getCategoryStats = async (req, res) => {
    try {
        const data = await statsService.getCategoryStats(req.query);
        res.json(data);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

/* =========================
   PRODUCT STATS
========================= */
exports.getProductStats = async (req, res) => {
    try {
        const data = await statsService.getProductStats(req.query);
        res.json(data);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

/* =========================
   DASHBOARD SUMMARY
========================= */
exports.getDashboardStats = async (req, res) => {
    try {
        const data = await statsService.getDashboardStats(req.query);
        res.json(data);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};