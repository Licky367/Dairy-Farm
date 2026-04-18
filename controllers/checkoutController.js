const Order = require("../models/Order");

exports.checkoutPage = (req, res) => {
    if (!req.session.user) return res.redirect("/login");

    res.render("checkout", {
        cart: req.session.cart || []
    });
};

exports.processCheckout = async (req, res) => {
    if (!req.session.user) return res.redirect("/login");

    const order = new Order({
        userId: req.session.user._id,
        items: req.session.cart,
        status: req.body.status
    });

    await order.save();

    req.session.cart = [];

    res.send("Order placed successfully");
};