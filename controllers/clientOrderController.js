const clientOrderService = require("../services/clientOrderServices");

/**
 * GET all user orders
 */
exports.getUserOrders = async (req, res) => {
    try {

        if (!req.session.user) {
            return res.redirect("/login");
        }

        const orders = await clientOrderService.getUserOrders(
            req.session.user._id
        );

        return res.render("clientOrders", { orders });

    } catch (err) {
        console.error(err);
        return res.status(500).send("Failed to load orders");
    }
};

/**
 * GET single order details
 */
exports.getOrderDetails = async (req, res) => {
    try {

        if (!req.session.user) {
            return res.redirect("/login");
        }

        const order = await clientOrderService.getOrderById(
            req.params.id,
            req.session.user._id
        );

        if (!order) {
            return res.status(404).send("Order not found");
        }

        return res.render("clientOrderDetails", { order });

    } catch (err) {
        console.error(err);
        return res.status(500).send("Failed to load order");
    }
};

/**
 * UPDATE DELIVERY INFO (SAFE FIELDS ONLY)
 */
exports.updateDeliveryInfo = async (req, res) => {
    try {

        if (!req.session.user) {
            return res.redirect("/login");
        }

        const updateData = {
            deliveryAddress: req.body.deliveryAddress,
            locationUrl: req.body.locationUrl,
            locationText: req.body.locationText,
            expectedDeliveryDate: req.body.expectedDeliveryDate
                ? new Date(req.body.expectedDeliveryDate)
                : null
        };

        await clientOrderService.updateDeliveryInfo(
            req.params.id,
            req.session.user._id,
            updateData
        );

        return res.redirect(`/client/orders/${req.params.id}`);

    } catch (err) {
        console.error(err);
        return res.status(500).send("Update failed");
    }
};