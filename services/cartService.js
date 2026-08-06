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
 * INCREASE ITEM QUANTITY
 */
exports.increaseQty = async (req, id) => {
    const cart = req.session.cart || [];
    const item = cart.find(entry => entry.id === id);

    if (!item) {
        throw new Error("Cart item not found");
    }

    const product = await Product.findOne({ id });
    if (!product) {
        throw new Error("Product not found");
    }

    if ((item.quantity || 0) + 1 > (product.itemsAvailable || 0)) {
        throw new Error("Cannot exceed available stock");
    }

    item.quantity += 1;
    req.session.cart = cart;
};

/**
 * DECREASE ITEM QUANTITY
 */
exports.decreaseQty = async (req, id) => {
    const cart = req.session.cart || [];
    const item = cart.find(entry => entry.id === id);

    if (!item) {
        throw new Error("Cart item not found");
    }

    if ((item.quantity || 1) <= 1) {
        req.session.cart = cart.filter(entry => entry.id !== id);
        return;
    }

    item.quantity -= 1;
    req.session.cart = cart;
};

/**
 * CLEAR CART
 */
exports.clearCart = (req) => {
    req.session.cart = [];
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