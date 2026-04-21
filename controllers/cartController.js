const cartService = require("../services/cartService");

exports.addToCart = async (req, res) => {
    try {
        await cartService.addToCart(req, req.params.id);

        return res.redirect("/cart");

    } catch (err) {
        return res.status(400).send(err.message || "Failed to add to cart");
    }
};

exports.viewCart = (req, res) => {
    const cart = cartService.getCart(req);

    res.render("cart", {
        cart,
        user: req.session.user || null
    });
};