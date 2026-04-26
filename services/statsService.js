const Order = require("../models/Order");
const Product = require("../models/Product");
const Statistical = require("../models/Statistical");

/* =========================
   SHARED FILTER
========================= */
const paidFilter = {
    status: { $in: ["paid", "paid(cash)"] }
};

/* =========================
   FINANCIAL STATS
========================= */
exports.getFinancialStats = async ({ month, year }) => {

    const now = new Date();

    const selectedYear = Number(year) || now.getFullYear();
    const selectedMonth = Number(month) || (now.getMonth() + 1);

    const start = new Date(selectedYear, selectedMonth - 1, 1);
    const end = new Date(selectedYear, selectedMonth, 0, 23, 59, 59);

    const orders = await Order.find({
        ...paidFilter,
        orderedAt: { $gte: start, $lte: end }
    });

    let revenue = 0;
    let cost = 0;
    let shipping = 0;

    orders.forEach(o => {
        revenue += Number(o.totalRevenue || 0);
        cost += Number(o.orderPurchasePrice || 0);
        shipping += Number(o.shippingCost || 0);
    });

    const profit = revenue - cost;
    const netProfit = profit - shipping;

    return {
        revenue,
        purchaseCost: cost,
        profit,
        netProfit,
        orders: orders.length
    };
};

/* =========================
   BUILD SNAPSHOT
========================= */
exports.buildMonthlyStatistics = async ({ month, year }) => {

    const now = new Date();

    const selectedYear = Number(year) || now.getFullYear();
    const selectedMonth = Number(month) || (now.getMonth() + 1);

    const start = new Date(selectedYear, selectedMonth - 1, 1);
    const end = new Date(selectedYear, selectedMonth, 0, 23, 59, 59);

    const orders = await Order.find({
        ...paidFilter,
        orderedAt: { $gte: start, $lte: end }
    });

    let revenue = 0;
    let purchaseCost = 0;
    let shippingCost = 0;

    const majorMap = {};
    const categoryMap = {};
    const productMap = {};

    for (let order of orders) {

        revenue += order.totalRevenue || 0;
        purchaseCost += order.orderPurchasePrice || 0;
        shippingCost += order.shippingCost || 0;

        for (let item of order.items) {

            const product = await Product.findOne({ id: item.id });
            if (!product) continue;

            const qty = item.quantity || 0;

            const itemRevenue = (item.cost || 0) * qty;
            const itemCost = (item.purchasePrice || 0) * qty;
            const itemProfit = itemRevenue - itemCost;
            const itemNet = itemProfit - (order.shippingCost || 0);

            const major = product.majorCategory || "Uncategorized";
            const category = product.category || "General";

            // MAJOR
            if (!majorMap[major]) {
                majorMap[major] = { majorCategory: major, revenue: 0, purchaseCost: 0, profit: 0, netProfit: 0, orderCount: 0 };
            }

            // CATEGORY
            const catKey = `${major}-${category}`;

            if (!categoryMap[catKey]) {
                categoryMap[catKey] = { majorCategory: major, category, revenue: 0, purchaseCost: 0, profit: 0, netProfit: 0, orderCount: 0 };
            }

            // PRODUCT
            if (!productMap[item.id]) {
                productMap[item.id] = {
                    productId: item.id,
                    name: product.name,
                    majorCategory: major,
                    category,
                    revenue: 0,
                    purchaseCost: 0,
                    profit: 0,
                    netProfit: 0,
                    unitsSold: 0
                };
            }

            // ACCUMULATE
            majorMap[major].revenue += itemRevenue;
            majorMap[major].purchaseCost += itemCost;
            majorMap[major].profit += itemProfit;
            majorMap[major].netProfit += itemNet;

            categoryMap[catKey].revenue += itemRevenue;
            categoryMap[catKey].purchaseCost += itemCost;
            categoryMap[catKey].profit += itemProfit;
            categoryMap[catKey].netProfit += itemNet;

            productMap[item.id].revenue += itemRevenue;
            productMap[item.id].purchaseCost += itemCost;
            productMap[item.id].profit += itemProfit;
            productMap[item.id].netProfit += itemNet;
            productMap[item.id].unitsSold += qty;
        }
    }

    const profit = revenue - purchaseCost;
    const netProfit = profit - shippingCost;

    const payload = {
        year: selectedYear,
        month: selectedMonth,
        periodType: "monthly",

        revenue,
        purchaseCost,
        profit,
        netProfit,
        shippingCost,
        orderCount: orders.length,

        majorCategoryStats: Object.values(majorMap),
        categoryStats: Object.values(categoryMap),
        productStats: Object.values(productMap)
    };

    const existing = await Statistical.findOne({
        year: selectedYear,
        month: selectedMonth,
        periodType: "monthly"
    });

    if (existing) {
        await Statistical.findByIdAndUpdate(existing._id, payload);
    } else {
        await Statistical.create(payload);
    }

    return payload;
};

/* =========================
   CATEGORY STATS (FILTERED)
========================= */
exports.getCategoryStats = async ({ month, year, majorCategory }) => {

    const data = await Statistical.findOne({
        month: Number(month),
        year: Number(year),
        periodType: "monthly"
    });

    if (!data) return [];

    let categories = data.categoryStats || [];

    // 🔥 FILTER BY MAJOR CATEGORY (NEW)
    if (majorCategory) {
        categories = categories.filter(
            c => c.majorCategory === majorCategory
        );
    }

    return categories;
};

/* =========================
   PRODUCT STATS
========================= */
exports.getProductStats = async ({ month, year }) => {

    const data = await Statistical.findOne({
        month: Number(month),
        year: Number(year),
        periodType: "monthly"
    });

    return data?.productStats || [];
};

/* =========================
   DASHBOARD SUMMARY
========================= */
exports.getDashboardStats = async ({ month, year }) => {

    const financial = await exports.getFinancialStats({ month, year });

    const snapshot = await Statistical.findOne({
        month: Number(month),
        year: Number(year),
        periodType: "monthly"
    });

    return {
        financial,
        majorCategoryStats: snapshot?.majorCategoryStats || [],
        categoryStats: snapshot?.categoryStats || [],
        productStats: snapshot?.productStats || []
    };
};