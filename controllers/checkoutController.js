const checkoutService = require("../services/checkoutService");

exports.checkoutPage = async (req, res) => {
    const cart = req.session.cart || [];

    if (cart.length === 0) {
        return res.redirect("/client");
    }

    try {
        const data = await checkoutService.prepareCheckout(cart);

        res.render("checkout", {
            cart: data.cart,
            totals: data.totals,
            user: req.session.user || null
        });

    } catch (err) {
        return res.status(400).render("checkout-error", {
            message: err.message || "Checkout preparation failed"
        });
    }
};

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

        const result = await checkoutService.processOrder({
            cart,
            user: req.session.user,
            paymentType
        });

        req.session.cart = [];

        return res.redirect(result.redirectUrl);

    } catch (err) {
        console.error(err);
        return res.status(500).send(err.message || "Checkout failed");
    }
};