const Product = require("../models/Product");

/**
 * ADD TO CART (stock-safe + validated)
 */
exports.addToCart = async (req, productId) => {
    if (!req.session.cart) req.session.cart = [];

    const cart = req.session.cart;

    const product = await Product.findOne({ id: productId });

    if (!product) {
        throw new Error("Product not found");
    }

    if ((product.itemsAvailable || 0) < 1) {
        throw new Error("Out of stock");
    }

    const existing = cart.find(item => item.id === product.id);

    const currentQty = existing ? existing.quantity : 0;

    if (currentQty + 1 > product.itemsAvailable) {
        throw new Error("Cannot exceed available stock");
    }

    if (existing) {
        existing.quantity += 1;
    } else {
        cart.push({
            id: product.id,
            name: product.name,
            cost: product.cost,
            quantity: 1,
            image: product.image,

            // 🔥 snapshot fields for checkout safety
            depositAmount: product.depositAmount,
            itemsAvailable: product.itemsAvailable
        });
    }

    req.session.cart = cart;
};

/**
 * REMOVE ITEM
 */
exports.removeFromCart = (req, id) => {
    req.session.cart = (req.session.cart || []).filter(
        item => item.id !== id
    );
};

/**
 * GET CART
 */
exports.getCart = (req) => {
    return req.session.cart || [];
};

/**
 * TOTAL CALCULATION (safe + consistent)
 */
exports.getTotal = (req) => {
    return (req.session.cart || []).reduce((sum, item) => {
        return sum + item.cost * item.quantity;
    }, 0);
};