const cartService = require("../services/cartService");

exports.addToCart = async (req, res) => {
    try {
        await cartService.addToCart(req, req.params.id);

        return res.redirect("/cart");

    } catch (err) {
        return res.status(400).send(err.message || "Failed to add to cart");
    }
};

exports.removeFromCart = (req, res) => {
    cartService.removeFromCart(req, req.params.id);
    return res.redirect("/cart");
};

exports.increaseQty = async (req, res) => {
    try {
        await cartService.increaseQty(req, req.params.id);
        return res.redirect("/cart");
    } catch (err) {
        return res.status(400).send(err.message || "Failed to update cart");
    }
};

exports.decreaseQty = async (req, res) => {
    try {
        await cartService.decreaseQty(req, req.params.id);
        return res.redirect("/cart");
    } catch (err) {
        return res.status(400).send(err.message || "Failed to update cart");
    }
};

exports.clearCart = (req, res) => {
    cartService.clearCart(req);
    return res.redirect("/cart");
};

exports.viewCart = (req, res) => {
    const cart = cartService.getCart(req);

    res.render("cart", {
        cart,
        user: req.session.user || null
    });
};