const Order = require("../models/Order");
const Product = require("../models/Product");
const Statistical = require("../models/Statistical");

/* =========================
   PAID FILTER
========================= */
const paidFilter = {
    status: { $in: ["paid", "paid(cash)"] }
};

/* =========================
   DATE RANGE HELPERS
========================= */
function getDateRange(month, year) {
    const now = new Date();

    const selectedYear = Number(year) || now.getFullYear();
    const selectedMonth = Number(month) || (now.getMonth() + 1);

    const start = new Date(selectedYear, selectedMonth - 1, 1);
    const end = new Date(selectedYear, selectedMonth, 0, 23, 59, 59);

    return { start, end, selectedMonth, selectedYear };
}

function getTimeRange({ timeMode, month, year }) {
    const now = new Date();

    if (!timeMode || timeMode === "month" || timeMode === "custom") {
        return getDateRange(month, year);
    }

    let start, end;
    let selectedMonth = now.getMonth() + 1;
    let selectedYear = now.getFullYear();

    switch (timeMode) {
        case "today":
            start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
            break;

        case "week": {
            const day = now.getDay(); // Sunday = 0
            const diffToMonday = now.getDate() - day + (day === 0 ? -6 : 1);

            start = new Date(now.getFullYear(), now.getMonth(), diffToMonday);
            end = new Date(now.getFullYear(), now.getMonth(), diffToMonday + 6, 23, 59, 59);
            break;
        }

        case "year":
            start = new Date(now.getFullYear(), 0, 1);
            end = new Date(now.getFullYear(), 11, 31, 23, 59, 59);
            selectedMonth = null;
            break;

        default:
            return getDateRange(month, year);
    }

    return {
        start,
        end,
        selectedMonth,
        selectedYear
    };
}

/* =========================
   FINANCIAL STATS
   - aligned with Order schema
========================= */
exports.getFinancialStats = async ({ month, year, timeMode }) => {

    const { start, end } = getTimeRange({ timeMode, month, year });

    const orders = await Order.find({
        ...paidFilter,
        orderedAt: { $gte: start, $lte: end }
    });

    let revenue = 0;
    let purchaseCost = 0;
    let shippingCost = 0;

    for (let order of orders) {
        revenue += Number(order.totalRevenue || 0);
        purchaseCost += Number(order.totalCost || 0);
        shippingCost += Number(order.shippingCost || 0);
    }

    const profit = revenue - purchaseCost;
    const netProfit = profit - shippingCost;

    return {
        revenue,
        purchaseCost,
        profit,
        netProfit,
        shippingCost,
        orders: orders.length
    };
};

/* =========================
   BUILD STATISTICS SNAPSHOT
   - aligned with frontend + schema
========================= */
exports.buildMonthlyStatistics = async ({ month, year, timeMode }) => {

    const { start, end, selectedMonth, selectedYear } =
        getTimeRange({ timeMode, month, year });

    const orders = await Order.find({
        ...paidFilter,
        orderedAt: { $gte: start, $lte: end }
    });

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

        const orderRevenue = Number(order.totalRevenue || 0);
        const orderCost = Number(order.totalCost || 0);
        const orderShipping = Number(order.shippingCost || 0);

        revenue += orderRevenue;
        purchaseCost += orderCost;
        shippingCost += orderShipping;

        const itemsCount = order.items?.length || 1;

        for (let item of order.items || []) {

            const product = productLookup[item.id];
            if (!product) continue;

            const qty = Number(item.quantity || 0);

            const sellPrice = Number(item.cost || 0); // selling price
            const buyPrice = Number(item.purchasePrice || 0); // buying price

            const itemRevenue = sellPrice * qty;
            const itemCost = buyPrice * qty;

            // ✅ profit per product = cost - purchasePrice
            const itemProfit = itemRevenue - itemCost;

            // distribute shipping equally
            const itemShippingShare = orderShipping / itemsCount;

            // ✅ netProfit = profit - shippingCost
            const itemNetProfit = itemProfit - itemShippingShare;

            const major = product.majorCategory || "Uncategorized";
            const category = product.category || "General";

            // =========================
            // MAJOR CATEGORY MAP
            // =========================
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

            // =========================
            // CATEGORY MAP
            // =========================
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

            // =========================
            // PRODUCT MAP
            // =========================
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

            // update totals
            majorMap[major].revenue += itemRevenue;
            majorMap[major].purchaseCost += itemCost;
            majorMap[major].profit += itemProfit;
            majorMap[major].netProfit += itemNetProfit;
            majorMap[major].unitsSold += qty;

            categoryMap[catKey].revenue += itemRevenue;
            categoryMap[catKey].purchaseCost += itemCost;
            categoryMap[catKey].profit += itemProfit;
            categoryMap[catKey].netProfit += itemNetProfit;
            categoryMap[catKey].unitsSold += qty;

            productMap[item.id].revenue += itemRevenue;
            productMap[item.id].purchaseCost += itemCost;
            productMap[item.id].profit += itemProfit;
            productMap[item.id].netProfit += itemNetProfit;
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
        categories = categories.filter(c => c.majorCategory === majorCategory);
    }

    return categories;
};

/* =========================
   PRODUCT STATS
========================= */
exports.getProductStats = async ({ month, year, majorCategory, category }) => {

    const data = await Statistical.findOne({
        month: Number(month),
        year: Number(year),
        periodType: "monthly"
    });

    if (!data) return [];

    let products = data.productStats || [];

    if (majorCategory) {
        products = products.filter(p => p.majorCategory === majorCategory);
    }

    if (category) {
        products = products.filter(p => p.category === category);
    }

    return products;
};

/* =========================
   DASHBOARD STATS
   - aligned with frontend ejs
========================= */
exports.getDashboardStats = async ({ month, year, timeMode }) => {

    const financial = await exports.getFinancialStats({
        month,
        year,
        timeMode
    });

    let snapshot = await Statistical.findOne({
        month: Number(month),
        year: Number(year),
        periodType: "monthly"
    });

    if (!snapshot) {
        snapshot = await exports.buildMonthlyStatistics({
            month,
            year,
            timeMode
        });
    }

    return {
        financial,
        majorCategoryStats: snapshot.majorCategoryStats || [],
        categoryStats: snapshot.categoryStats || [],
        productStats: snapshot.productStats || []
    };
};