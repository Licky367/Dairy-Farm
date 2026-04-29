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
            const day = now.getDay();
            const diff = now.getDate() - day + (day === 0 ? -6 : 1);
            start = new Date(now.getFullYear(), now.getMonth(), diff);
            end = new Date(now.getFullYear(), now.getMonth(), diff + 6, 23, 59, 59);
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

    return { start, end, selectedMonth, selectedYear };
}

function resolveMonthYear(month, year) {
    const now = new Date();
    return {
        month: Number(month) || (now.getMonth() + 1),
        year: Number(year) || now.getFullYear()
    };
}

/* =========================
   SMOOTHING FUNCTION
========================= */
function smoothCurve(data, windowSize = 3) {
    if (!data || data.length === 0) return [];

    const sorted = [...data].sort((a, b) => a.price - b.price);

    return sorted.map((_, i) => {
        let start = Math.max(0, i - windowSize);
        let end = Math.min(sorted.length, i + windowSize + 1);

        const slice = sorted.slice(start, end);

        const avgDemand =
            slice.reduce((sum, p) => sum + p.demand, 0) / slice.length;

        return {
            price: sorted[i].price,
            demand: avgDemand
        };
    });
}

/* =========================
   FINANCIAL STATS
========================= */
exports.getFinancialStats = async ({ month, year, timeMode }) => {

    const { start, end } = getTimeRange({ timeMode, month, year });

    const orders = await Order.find({
        ...paidFilter,
        orderedAt: { $gte: start, $lte: end }
    });

    let revenue = 0;
    let purchaseCost = 0;
    let transportationCost = 0;

    for (let order of orders) {
        revenue += Number(order.totalRevenue || 0);
        purchaseCost += Number(order.totalCost || 0);
        transportationCost += Number(order.transportationCost || 0);
    }

    const profit = revenue - purchaseCost;
    const netProfit = profit - transportationCost;

    return {
        revenue,
        purchaseCost,
        profit,
        netProfit,
        transportationCost,
        orders: orders.length
    };
};

/* =========================
   LIVE STATISTICS + DEMAND CURVES
========================= */
async function buildLiveStatistics({ month, year, timeMode }) {

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
    let transportationCost = 0;

    const majorMap = {};
    const categoryMap = {};
    const productMap = {};

    const majorDemand = {};
    const categoryDemand = {};
    const timeDemand = {};

    for (let order of orders) {

        const orderTransportation = Number(order.transportationCost || 0);

        revenue += Number(order.totalRevenue || 0);
        purchaseCost += Number(order.totalCost || 0);
        transportationCost += orderTransportation;

        for (let item of order.items || []) {

            const product = productLookup[item.id];
            if (!product || !product.productUnits) continue;

            const qty = Number(item.quantity || 0);
            const sellPrice = Number(item.cost || 0);

            const unitPrice = sellPrice / product.productUnits;
            const trueUnits = qty * product.productUnits;

            const major = product.majorCategory || "Uncategorized";
            const category = product.category || "General";

            const priceKey = unitPrice.toFixed(2);

            if (!majorDemand[major]) majorDemand[major] = {};
            if (!majorDemand[major][priceKey]) {
                majorDemand[major][priceKey] = { price: Number(priceKey), demand: 0 };
            }
            majorDemand[major][priceKey].demand += trueUnits;

            const catKey = `${major}__${category}`;
            if (!categoryDemand[catKey]) categoryDemand[catKey] = {};
            if (!categoryDemand[catKey][priceKey]) {
                categoryDemand[catKey][priceKey] = { price: Number(priceKey), demand: 0 };
            }
            categoryDemand[catKey][priceKey].demand += trueUnits;

            if (!timeDemand[priceKey]) {
                timeDemand[priceKey] = { price: Number(priceKey), demand: 0 };
            }
            timeDemand[priceKey].demand += trueUnits;

            /* =========================
               EXISTING LOGIC (UNCHANGED)
            ========================= */
            const itemRevenue = sellPrice * qty;
            const itemCost = Number(item.purchasePrice || 0) * qty;
            const itemProfit = itemRevenue - itemCost;

            const itemsCount = order.items?.length || 1;
            const transportationShare = orderTransportation / itemsCount;
            const netProfit = itemProfit - transportationShare;

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

            const catMapKey = `${major}__${category}`;
            if (!categoryMap[catMapKey]) {
                categoryMap[catMapKey] = {
                    majorCategory: major,
                    category,
                    revenue: 0,
                    purchaseCost: 0,
                    profit: 0,
                    netProfit: 0,
                    unitsSold: 0
                };
            }

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

            majorMap[major].revenue += itemRevenue;
            majorMap[major].unitsSold += qty;

            categoryMap[catMapKey].revenue += itemRevenue;
            categoryMap[catMapKey].unitsSold += qty;

            productMap[item.id].revenue += itemRevenue;
            productMap[item.id].unitsSold += qty;
        }
    }

    const formatCurve = obj =>
        Object.values(obj).sort((a, b) => a.price - b.price);

    const demandCurves = {
        global: smoothCurve(formatCurve(timeDemand)),
        majorCategory: Object.keys(majorDemand).map(k => ({
            majorCategory: k,
            curve: smoothCurve(formatCurve(majorDemand[k]))
        })),
        category: Object.keys(categoryDemand).map(k => ({
            categoryKey: k,
            curve: smoothCurve(formatCurve(categoryDemand[k]))
        }))
    };

    const profit = revenue - purchaseCost;
    const netProfit = profit - transportationCost;

    let periodType = "monthly";
    if (timeMode === "today") periodType = "daily";
    if (timeMode === "week") periodType = "weekly";
    if (timeMode === "year") periodType = "yearly";

    return {
        year: selectedYear,
        month: selectedMonth,
        periodType,

        revenue,
        purchaseCost,
        profit,
        netProfit,
        transportationCost,
        orderCount: orders.length,

        majorCategoryStats: Object.values(majorMap),
        categoryStats: Object.values(categoryMap),
        productStats: Object.values(productMap),

        demandCurves
    };
}

/* =========================
   SNAPSHOT FUNCTIONS (UNCHANGED BELOW)
========================= */

exports.buildMonthlyStatistics = async ({ month, year }) => {

    const fixed = resolveMonthYear(month, year);

    const payload = await buildLiveStatistics({
        month: fixed.month,
        year: fixed.year,
        timeMode: "custom"
    });

    await Statistical.findOneAndUpdate(
        {
            year: payload.year,
            month: payload.month,
            periodType: "monthly"
        },
        payload,
        { upsert: true, new: true }
    );

    return payload;
};

exports.getCategoryStats = async ({ month, year, majorCategory }) => {

    const fixed = resolveMonthYear(month, year);

    const data = await Statistical.findOne({
        month: fixed.month,
        year: fixed.year,
        periodType: "monthly"
    });

    if (!data) return [];

    let categories = data.categoryStats || [];

    if (majorCategory) {
        categories = categories.filter(c => c.majorCategory === majorCategory);
    }

    return categories;
};

exports.getProductStats = async ({ month, year, majorCategory, category }) => {

    const fixed = resolveMonthYear(month, year);

    const data = await Statistical.findOne({
        month: fixed.month,
        year: fixed.year,
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

exports.getDashboardStats = async ({ month, year, timeMode }) => {

    const financial = await exports.getFinancialStats({
        month,
        year,
        timeMode
    });

    if (timeMode && timeMode !== "custom" && timeMode !== "month") {

        const live = await buildLiveStatistics({
            month,
            year,
            timeMode
        });

        return {
            financial,
            majorCategoryStats: live.majorCategoryStats,
            categoryStats: live.categoryStats,
            productStats: live.productStats,
            demandCurves: live.demandCurves
        };
    }

    const fixed = resolveMonthYear(month, year);

    let snapshot = await Statistical.findOne({
        month: fixed.month,
        year: fixed.year,
        periodType: "monthly"
    });

    if (!snapshot) {
        snapshot = await exports.buildMonthlyStatistics({
            month: fixed.month,
            year: fixed.year
        });
    }

    return {
        financial,
        majorCategoryStats: snapshot.majorCategoryStats,
        categoryStats: snapshot.categoryStats,
        productStats: snapshot.productStats,
        demandCurves: snapshot.demandCurves || null
    };
};