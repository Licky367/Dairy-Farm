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

        return res.render("clientOrders", {
            orders
        });

    } catch (err) {
        console.error(err);
        return res.status(500).send("Failed to load orders");
    }
};


/**
 * GET single order details
 * (FULL PAYMENT + DELIVERY CONTEXT SUPPORTED)
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

        /* ================= PAYMENT LINK ================= */
        const paymentUrl = `/payment?orderId=${order._id}`;

        /* ================= NORMALIZATION (IMPORTANT FOR VIEW LOGIC) ================= */

        const normalizedOrder = {
            ...order.toObject(),

            // ensure numeric safety for EJS calculations
            totalAmount: Number(order.totalAmount || 0),
            depositAmount: Number(order.depositAmount || 0),
            arrearAmount: Number(order.arrearAmount || 0),
            depositAmountPaid: Number(order.depositAmountPaid || 0),

            // ensure delivery flag consistency
            delivered: !!order.delivered
        };

        return res.render("clientOrderDetails", {
            order: normalizedOrder,
            paymentUrl
        });

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