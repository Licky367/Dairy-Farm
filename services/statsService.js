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
   DATE HELPERS (UNCHANGED)
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
   FINANCIAL STATS (CLEAN)
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
    let profit = 0;
    let netProfit = 0;

    for (let o of orders) {
        revenue += o.totalRevenue || 0;
        purchaseCost += o.totalCost || 0;
        transportationCost += o.transportationCost || 0;
        profit += o.profit || 0;
        netProfit += o.netProfit || 0;
    }

    return {
        revenue,
        purchaseCost,
        transportationCost,
        profit,
        netProfit,
        orders: orders.length
    };
};

/* =========================
   LIVE STATISTICS (FIXED CORE LOGIC)
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
    products.forEach(p => productLookup[p.id] = p);

    let majorMap = {};
    let categoryMap = {};
    let productMap = {};

    for (let order of orders) {

        for (let item of order.items || []) {

            const product = productLookup[item.id];
            if (!product || !product.productUnits) continue;

            const qty = Number(item.quantity || 0);
            const revenue = Number(item.cost || 0) * qty;
            const cost = Number(item.purchasePrice || 0) * qty;

            const profit = revenue - cost;
            const netProfit = profit - Number(order.transportationCost || 0) / (order.items.length || 1);

            const major = product.majorCategory || "Uncategorized";
            const category = product.category || "General";

            /* =========================
               MAJOR
            ========================= */
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

            majorMap[major].revenue += revenue;
            majorMap[major].purchaseCost += cost;
            majorMap[major].profit += profit;
            majorMap[major].netProfit += netProfit;
            majorMap[major].unitsSold += qty;

            /* =========================
               CATEGORY
            ========================= */
            const cKey = `${major}__${category}`;

            if (!categoryMap[cKey]) {
                categoryMap[cKey] = {
                    majorCategory: major,
                    category,
                    revenue: 0,
                    purchaseCost: 0,
                    profit: 0,
                    netProfit: 0,
                    unitsSold: 0
                };
            }

            categoryMap[cKey].revenue += revenue;
            categoryMap[cKey].purchaseCost += cost;
            categoryMap[cKey].profit += profit;
            categoryMap[cKey].netProfit += netProfit;
            categoryMap[cKey].unitsSold += qty;

            /* =========================
               PRODUCT
            ========================= */
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

            productMap[item.id].revenue += revenue;
            productMap[item.id].purchaseCost += cost;
            productMap[item.id].profit += profit;
            productMap[item.id].netProfit += netProfit;
            productMap[item.id].unitsSold += qty;
        }
    }

    return {
        year: selectedYear,
        month: selectedMonth,
        periodType: timeMode || "monthly",

        ...await exports.getFinancialStats({ month, year, timeMode }),

        majorCategoryStats: Object.values(majorMap),
        categoryStats: Object.values(categoryMap),
        productStats: Object.values(productMap)
    };
}

/* =========================
   REST (UNCHANGED STRUCTURE)
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