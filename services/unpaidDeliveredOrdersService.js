const Order = require("../models/Order");

/* ================= BASE FILTER ================= */
const baseFilter = {
    delivered: true,
    arrearAmount: { $gt: 0 }
};


/* ================= ADMIN ================= */
exports.getUnpaidDeliveredOrders = async () => {

    const orders = await Order.find(baseFilter)
        .sort({ deliveredAt: -1 })
        .lean();

    /* ================= NORMALIZE ================= */
    return orders.map(order => ({
        ...order,
        arrearAmount: Number(order.arrearAmount || 0)
    }));
};


/* ================= CLIENT ================= */
exports.getUnpaidDeliveredOrdersByUser = async (userId) => {

    const orders = await Order.find({
        ...baseFilter,
        userId
    })
    .sort({ deliveredAt: -1 })
    .lean();

    let totalArrears = 0;

    const normalizedOrders = orders.map(order => {
        const arrears = Number(order.arrearAmount || 0);
        totalArrears += arrears;

        return {
            ...order,
            arrearAmount: arrears
        };
    });

    return {
        orders: normalizedOrders,
        totalArrears
    };
};