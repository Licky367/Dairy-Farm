const productService = require("../services/productService");
const cartService = require("../services/cartService");

exports.addToCart = async (req, res) => {
    const product = await productService.getProductById(req.params.id);

    cartService.addToCart(req, product);

    res.redirect("/cart");
};

exports.viewCart = (req, res) => {
    const cart = cartService.getCart(req);

    res.render("cart", {
        cart,
        user: req.session.user || null
    });
};