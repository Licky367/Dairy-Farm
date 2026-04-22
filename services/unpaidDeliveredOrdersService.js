const Order = require("../models/Order");

/* ================= BASE FILTER ================= */
const baseFilter = {
    delivered: true,
    arrearAmount: { $gt: 0 }
};


/* ================= ADMIN ================= */
exports.getUnpaidDeliveredOrders = async () => {

    return await Order.find(baseFilter)
        .sort({ deliveredAt: -1 })
        .lean();
};


/* ================= CLIENT ================= */
exports.getUnpaidDeliveredOrdersByUser = async (userId) => {

    return await Order.find({
        ...baseFilter,
        userId
    })
    .sort({ deliveredAt: -1 })
    .lean();
};