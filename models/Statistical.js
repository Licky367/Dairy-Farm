const mongoose = require("mongoose");

const statisticalSchema = new mongoose.Schema(
{
    // 📅 TIME DIMENSION
    year: Number,
    month: Number,
    day: Number, // optional (for daily analytics)

    periodType: {
        type: String,
        enum: ["daily", "monthly", "yearly"],
        default: "monthly"
    },

    // =========================
    // 💰 CORE FINANCIAL METRICS
    // =========================

    revenue: {
        type: Number,
        default: 0
    },

    purchaseCost: {
        type: Number,
        default: 0
    },

    profit: {
        type: Number,
        default: 0
    },

    netProfit: {
        type: Number,
        default: 0
    },

    shippingCost: {
        type: Number,
        default: 0
    },

    orderCount: {
        type: Number,
        default: 0
    },

    // =========================
    // 🏷️ CATEGORY ANALYTICS
    // =========================

    majorCategoryStats: [
        {
            majorCategory: String,
            revenue: Number,
            purchaseCost: Number,
            profit: Number,
            netProfit: Number,
            orderCount: Number
        }
    ],

    categoryStats: [
        {
            majorCategory: String,
            category: String,
            revenue: Number,
            purchaseCost: Number,
            profit: Number,
            netProfit: Number,
            orderCount: Number
        }
    ],

    productStats: [
        {
            productId: String,
            name: String,
            category: String,
            majorCategory: String,
            revenue: Number,
            purchaseCost: Number,
            profit: Number,
            netProfit: Number,
            unitsSold: Number
        }
    ]

},
{
    timestamps: true
}
);

module.exports = mongoose.model("Statistical", statisticalSchema);