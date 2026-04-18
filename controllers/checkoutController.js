const Order = require("../models/Order");
const cartService = require("../services/cartService");

exports.checkoutPage = (req, res) => {
    const cart = req.session.cart || [];

    if (cart.length === 0) return res.send("Cart is empty");

    res.render("checkout", {
        cart,
        total: cartService.getTotal(req)
    });
};

exports.processCheckout = async (req, res) => {
    const cart = req.session.cart || [];

    if (cart.length === 0) return res.send("Cart is empty");

    const order = new Order({
        userId: req.session.user._id,
        items: cart,
        totalAmount: cartService.getTotal(req),
        status: req.body.status
    });

    await order.save();

    req.session.cart = [];

    res.redirect("/client");
};