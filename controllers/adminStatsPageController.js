const statsService = require("../services/statsService");

exports.statsPage = async (req, res) => {

    const month = req.query.month;
    const year = req.query.year;

    const financial = await statsService.getFinancialStats({ month, year });
    const snapshot = await statsService.getDashboardStats({ month, year });

    res.render("admin/stats", {
        financial: financial,
        majorCategoryStats: snapshot.majorCategoryStats,
        categoryStats: snapshot.categoryStats,
        productStats: snapshot.productStats
    });
};