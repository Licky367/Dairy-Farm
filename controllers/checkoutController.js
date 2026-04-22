const checkoutService = require("../services/checkoutService");

/**
 * GET checkout page
 */
exports.checkoutPage = async (req, res) => {
    const cart = req.session.cart || [];

    if (cart.length === 0) {
        return res.redirect("/client");
    }

    try {

        // ✅ correct service function
        const totals = checkoutService.calculateTotals(cart);

        return res.render("checkout", {
            cart,
            totals,
            user: req.session.user || null
        });

    } catch (err) {
        console.error(err);

        return res.status(400).render("checkout-error", {
            message: err.message || "Checkout preparation failed"
        });
    }
};

/**
 * POST checkout process
 */
exports.processCheckout = async (req, res) => {
    try {

        const cart = req.session.cart || [];

        if (!req.session.user) {
            return res.redirect("/login");
        }

        if (cart.length === 0) {
            return res.send("Cart empty");
        }

        const { paymentType } = req.body;

        /* ================= ALIGNMENT FIX: DELIVERY DATA ================= */

        const deliveryData = {
            address: req.body.address || null,
            locationUrl: req.body.locationUrl || null,
            locationLat: req.body.locationLat || null,
            locationLng: req.body.locationLng || null,
            locationText: req.body.locationText || null,
            expectedDeliveryDate: req.body.expectedDeliveryDate || null
        };

        // ✅ correct service function (now fully aligned)
        const result = await checkoutService.createOrderAndHandlePayment(
            cart,
            req.session.user,
            paymentType,
            deliveryData
        );

        // clear cart after successful order
        req.session.cart = [];

        return res.redirect(result.redirectUrl);

    } catch (err) {
        console.error(err);

        return res.status(500).send(
            err.message || "Checkout failed"
        );
    }
};