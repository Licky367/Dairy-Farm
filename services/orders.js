const Order = require("../models/Order");

/**
 * Compute correct payable amount
 */
function computeAmount(order) {

    if (order.status === "depositPaid") {
        return order.arrearAmount;
    }

    if (order.status === "payAfter") {
        return order.totalAmount;
    }

    return order.totalAmount;
}

/**
 * GET FILTERED ORDERS
 */
exports.getFilteredOrders = async ({ deliveryStatus, month, year }) => {

    const query = {};

    // delivery filter
    if (deliveryStatus === "delivered") {
        query.delivered = true;
    }

    if (deliveryStatus === "undelivered") {
        query.delivered = false;
    }

    // date filter
    if (month || year) {
        query.orderedAt = {};

        if (year) {
            query.orderedAt.$gte = new Date(year, 0, 1);
            query.orderedAt.$lte = new Date(year, 11, 31, 23, 59, 59);
        }

        if (month && year) {
            const start = new Date(year, month - 1, 1);
            const end = new Date(year, month, 0, 23, 59, 59);

            query.orderedAt = {
                $gte: start,
                $lte: end
            };
        }
    }

    const orders = await Order.find(query).sort({ createdAt: -1 });

    return orders;
};

/**
 * MARK CASH PAYMENT
 */
exports.markAsPaidCash = async (orderId, admin) => {

    const order = await Order.findById(orderId);

    if (!order) throw new Error("Order not found");

    const amount = computeAmount(order);

    order.status = "paid(cash)";
    order.manualPayment = {
        adminId: admin._id,
        adminName: admin.name,
        amount,
        method: "cash",
        paidAt: new Date()
    };

    await order.save();

    return order;
};

/**
 * MARK DELIVERY
 */
exports.markAsDelivered = async (orderId, admin) => {

    const order = await Order.findById(orderId);

    if (!order) throw new Error("Order not found");

    order.delivered = true;
    order.deliveredBy = {
        adminId: admin._id,
        adminName: admin.name
    };
    order.deliveredAt = new Date();

    await order.save();

    return order;
};