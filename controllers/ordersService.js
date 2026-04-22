const Order = require("../models/Order");

/* ================= GET ALL ORDERS (FILTERED) ================= */
exports.getAllOrders = async (filters) => {
  const query = {};

  if (filters.deliveryStatus) {
    query.delivered = filters.deliveryStatus === "delivered";
  }

  if (filters.month && filters.year) {
    const month = parseInt(filters.month);
    const year = parseInt(filters.year);

    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 0, 23, 59, 59);

    query.createdAt = { $gte: start, $lte: end };
  }

  return await Order.find(query).sort({ createdAt: -1 });
};


/* ================= GET SINGLE ORDER ================= */
exports.getOrderById = async (id) => {
  return await Order.findById(id);
};


/* ================= MARK AS PAID ================= */
exports.markAsPaid = async (orderId, adminName) => {
  return await Order.findByIdAndUpdate(orderId, {
    status: "paid",
    manualPayment: {
      adminName,
      amountPaid: true,
      paidAt: new Date()
    }
  });
};


/* ================= MARK AS DELIVERED ================= */
exports.markAsDelivered = async (orderId, shippingCost) => {
  return await Order.findByIdAndUpdate(orderId, {
    delivered: true,
    shippingCost: Number(shippingCost),
    deliveryDate: new Date()
  });
};