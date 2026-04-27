const mongoose = require("mongoose");

/* ===============================
   REUSABLE ANALYTICS SUBSCHEMAS
=============================== */

const majorCategoryStatSchema = new mongoose.Schema(
{
    majorCategory: {
        type: String,
        required: true,
        trim: true
    },

    revenue: {
        type: Number,
        default: 0,
        min: 0
    },

    purchaseCost: {
        type: Number,
        default: 0,
        min: 0
    },

    profit: {
        type: Number,
        default: 0
    },

    netProfit: {
        type: Number,
        default: 0
    },

    unitsSold: {
        type: Number,
        default: 0,
        min: 0
    }
},
{ _id: false }
);

const categoryStatSchema = new mongoose.Schema(
{
    majorCategory: {
        type: String,
        required: true,
        trim: true
    },

    category: {
        type: String,
        required: true,
        trim: true
    },

    revenue: {
        type: Number,
        default: 0,
        min: 0
    },

    purchaseCost: {
        type: Number,
        default: 0,
        min: 0
    },

    profit: {
        type: Number,
        default: 0
    },

    netProfit: {
        type: Number,
        default: 0
    },

    unitsSold: {
        type: Number,
        default: 0,
        min: 0
    }
},
{ _id: false }
);

const productStatSchema = new mongoose.Schema(
{
    productId: {
        type: String,
        required: true,
        trim: true
    },

    name: {
        type: String,
        required: true,
        trim: true
    },

    majorCategory: {
        type: String,
        default: "Uncategorized",
        trim: true
    },

    category: {
        type: String,
        default: "General",
        trim: true
    },

    revenue: {
        type: Number,
        default: 0,
        min: 0
    },

    purchaseCost: {
        type: Number,
        default: 0,
        min: 0
    },

    profit: {
        type: Number,
        default: 0
    },

    netProfit: {
        type: Number,
        default: 0
    },

    unitsSold: {
        type: Number,
        default: 0,
        min: 0
    }
},
{ _id: false }
);

/* ===============================
   MAIN STATISTICAL SCHEMA
=============================== */

const statisticalSchema = new mongoose.Schema(
{
    /* =========================
       TIME DIMENSION
    ========================= */
    year: {
        type: Number,
        required: true,
        min: 2000
    },

    month: {
        type: Number,
        min: 1,
        max: 12,
        default: null
    },

    day: {
        type: Number,
        min: 1,
        max: 31,
        default: null
    },

    periodType: {
        type: String,
        enum: ["daily", "weekly", "monthly", "yearly"],
        default: "monthly",
        required: true
    },

    /* =========================
       CORE FINANCIAL METRICS
    ========================= */
    revenue: {
        type: Number,
        default: 0,
        min: 0
    },

    purchaseCost: {
        type: Number,
        default: 0,
        min: 0
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
        default: 0,
        min: 0
    },

    orderCount: {
        type: Number,
        default: 0,
        min: 0
    },

    /* =========================
       BREAKDOWN ANALYTICS
    ========================= */
    majorCategoryStats: {
        type: [majorCategoryStatSchema],
        default: []
    },

    categoryStats: {
        type: [categoryStatSchema],
        default: []
    },

    productStats: {
        type: [productStatSchema],
        default: []
    }
},
{
    timestamps: true
}
);

/* ===============================
   INDEXES
=============================== */

/* Prevent duplicate same-period snapshots */
statisticalSchema.index(
{
    year: 1,
    month: 1,
    day: 1,
    periodType: 1
},
{ unique: true }
);

/* Faster dashboard filtering */
statisticalSchema.index({ year: 1, month: 1 });
statisticalSchema.index({ periodType: 1 });

module.exports = mongoose.model("Statistical", statisticalSchema);