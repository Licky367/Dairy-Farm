const OrdersService = require("../services/orders");
const Order = require("../models/Order");

/**
 * GET /admin/orders
 */
exports.getAllOrders = async (req, res) => {
    try {

        const { deliveryStatus, month, year } = req.query;

        const orders = await OrdersService.getFilteredOrders({
            deliveryStatus,
            month,
            year
        });

        return res.render("orders", {
            orders,
            query: req.query,
            user: req.user
        });

    } catch (err) {
        console.error(err);
        return res.status(500).send("Error loading orders");
    }
};

/**
 * POST /:id/pay
 * Mark order as paid (cash)
 */
exports.markAsPaidCash = async (req, res) => {
    try {

        const orderId = req.params.id;

        await OrdersService.markAsPaidCash(orderId, req.user);

        return res.redirect("/admin/orders");

    } catch (err) {
        console.error(err);
        return res.status(500).send(err.message);
    }
};

/**
 * POST /:id/deliver
 */
exports.markAsDelivered = async (req, res) => {
    try {

        const orderId = req.params.id;

        // =========================
        // NEW: shipping cost from form
        // =========================
        const { shippingCost } = req.body;

        await OrdersService.markAsDelivered(
            orderId,
            req.user,
            shippingCost
        );

        return res.redirect("/admin/orders");

    } catch (err) {
        console.error(err);
        return res.status(500).send(err.message);
    }
};