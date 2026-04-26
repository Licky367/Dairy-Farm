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
   DATE HELPER
========================= */
function getDateRange(month, year) {
    const now = new Date();

    const selectedYear = Number(year) || now.getFullYear();
    const selectedMonth = Number(month) || (now.getMonth() + 1);

    const start = new Date(selectedYear, selectedMonth - 1, 1);
    const end = new Date(selectedYear, selectedMonth, 0, 23, 59, 59);

    return { start, end, selectedMonth, selectedYear };
}

/* =========================
   FINANCIAL STATS
========================= */
exports.getFinancialStats = async ({ month, year }) => {

    const { start, end } = getDateRange(month, year);

    const orders = await Order.find({
        ...paidFilter,
        orderedAt: { $gte: start, $lte: end }
    });

    let revenue = 0;
    let cost = 0;
    let shipping = 0;

    for (let o of orders) {
        revenue += Number(o.totalRevenue || 0);
        cost += Number(o.orderPurchasePrice || 0);
        shipping += Number(o.shippingCost || 0);
    }

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
   BUILD SNAPSHOT (OPTIMIZED)
========================= */
exports.buildMonthlyStatistics = async ({ month, year }) => {

    const { start, end, selectedMonth, selectedYear } = getDateRange(month, year);

    const orders = await Order.find({
        ...paidFilter,
        orderedAt: { $gte: start, $lte: end }
    });

    // 🔥 FETCH ALL PRODUCTS ONCE (fixes N+1 problem)
    const products = await Product.find({});
    const productLookup = {};

    products.forEach(p => {
        productLookup[p.id] = p;
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

            const product = productLookup[item.id];
            if (!product) continue;

            const qty = item.quantity || 0;

            const itemRevenue = (item.cost || 0) * qty;
            const itemCost = (item.purchasePrice || 0) * qty;
            const itemProfit = itemRevenue - itemCost;

            // 🔥 FIX: distribute shipping properly per item
            const itemShippingShare = (order.shippingCost || 0) / (order.items.length || 1);
            const itemNet = itemProfit - itemShippingShare;

            const major = product.majorCategory || "Uncategorized";
            const category = product.category || "General";

            // ===== MAJOR =====
            if (!majorMap[major]) {
                majorMap[major] = {
                    majorCategory: major,
                    revenue: 0,
                    purchaseCost: 0,
                    profit: 0,
                    netProfit: 0,
                    unitsSold: 0
                };
            }

            // ===== CATEGORY =====
            const catKey = `${major}__${category}`;

            if (!categoryMap[catKey]) {
                categoryMap[catKey] = {
                    majorCategory: major,
                    category,
                    revenue: 0,
                    purchaseCost: 0,
                    profit: 0,
                    netProfit: 0,
                    unitsSold: 0
                };
            }

            // ===== PRODUCT =====
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

            // ===== ACCUMULATE =====
            majorMap[major].revenue += itemRevenue;
            majorMap[major].purchaseCost += itemCost;
            majorMap[major].profit += itemProfit;
            majorMap[major].netProfit += itemNet;
            majorMap[major].unitsSold += qty;

            categoryMap[catKey].revenue += itemRevenue;
            categoryMap[catKey].purchaseCost += itemCost;
            categoryMap[catKey].profit += itemProfit;
            categoryMap[catKey].netProfit += itemNet;
            categoryMap[catKey].unitsSold += qty;

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

    // UPSERT
    await Statistical.findOneAndUpdate(
        {
            year: selectedYear,
            month: selectedMonth,
            periodType: "monthly"
        },
        payload,
        { upsert: true, new: true }
    );

    return payload;
};

/* =========================
   CATEGORY STATS
========================= */
exports.getCategoryStats = async ({ month, year, majorCategory }) => {

    const data = await Statistical.findOne({
        month: Number(month),
        year: Number(year),
        periodType: "monthly"
    });

    if (!data) return [];

    let categories = data.categoryStats || [];

    if (majorCategory) {
        categories = categories.filter(
            c => c.majorCategory === majorCategory
        );
    }

    return categories;
};

/* =========================
   PRODUCT STATS (FILTERABLE 🔥)
========================= */
exports.getProductStats = async ({ month, year, majorCategory, category }) => {

    const data = await Statistical.findOne({
        month: Number(month),
        year: Number(year),
        periodType: "monthly"
    });

    if (!data) return [];

    let products = data.productStats || [];

    // 🔥 FILTER BY MAJOR
    if (majorCategory) {
        products = products.filter(
            p => p.majorCategory === majorCategory
        );
    }

    // 🔥 FILTER BY CATEGORY
    if (category) {
        products = products.filter(
            p => p.category === category
        );
    }

    return products;
};

/* =========================
   DASHBOARD SUMMARY
========================= */
exports.getDashboardStats = async ({ month, year }) => {

    const financial = await exports.getFinancialStats({ month, year });

    let snapshot = await Statistical.findOne({
        month: Number(month),
        year: Number(year),
        periodType: "monthly"
    });

    // 🔥 AUTO-BUILD if missing
    if (!snapshot) {
        snapshot = await exports.buildMonthlyStatistics({ month, year });
    }

    return {
        financial,
        majorCategoryStats: snapshot.majorCategoryStats || [],
        categoryStats: snapshot.categoryStats || [],
        productStats: snapshot.productStats || []
    };
};