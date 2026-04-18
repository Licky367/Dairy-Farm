const Order = require("../models/Order");
const cartService = require("../services/cartService");
const mpesaService = require("../services/mpesaService");

exports.processCheckout = async (req, res) => {
    const cart = req.session.cart || [];

    if (cart.length === 0) return res.send("Cart is empty");

    const total = cartService.getTotal(req);

    const order = new Order({
        userId: req.session.user._id,
        items: cart,
        totalAmount: total,
        status: req.body.status
    });

    await order.save();

    // 🟢 IF USER CHOSE PAID OR DEPOSIT → TRIGGER MPESA
    if (req.body.status === "paid" || req.body.status === "depositPaid") {

        const phone = req.session.user.phone;

        const amount = req.body.status === "depositPaid"
            ? Math.floor(total * 0.3)
            : total;

        await mpesaService.stkPush(phone, amount, order._id);

    }

    req.session.cart = [];

    res.send("Order placed. Check phone for M-Pesa prompt.");
};