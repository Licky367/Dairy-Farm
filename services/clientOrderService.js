const Order = require("../models/Order");

/**
 * GET USER ORDERS
 */
exports.getUserOrders = async (userId) => {

    return await Order.find({ userId })
        .sort({ createdAt: -1 });
};

/**
 * GET SINGLE ORDER (SECURED BY USER ID)
 */
exports.getOrderById = async (orderId, userId) => {

    return await Order.findOne({
        _id: orderId,
        userId: userId
    });
};

/**
 * UPDATE DELIVERY INFO (SAFE ONLY)
 */
exports.updateDeliveryInfo = async (orderId, userId, data) => {

    const allowedUpdate = {
        deliveryAddress: data.deliveryAddress || null,
        locationUrl: data.locationUrl || null,
        locationText: data.locationText || null,
        expectedDeliveryDate: data.expectedDeliveryDate || null
    };

    return await Order.findOneAndUpdate(
        { _id: orderId, userId },
        { $set: allowedUpdate },
        { new: true }
    );
};