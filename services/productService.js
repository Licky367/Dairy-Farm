const Product = require("../models/Product");

/**
 * Get single product by ID (client/product page)
 * Clean + frontend-ready response
 */
exports.getProductById = async (id) => {
    const product = await Product.findOne({ id }).lean();

    if (!product) return null;

    return {
        id: product.id,
        name: product.name,
        category: product.category,
        image: product.image,
        cost: product.cost,
        depositPercentage: product.depositPercentage,
        depositAmount: product.depositAmount,
        description: product.description,

        // 🔥 STOCK SUPPORT (critical for your UI upgrades)
        itemsAvailable: product.itemsAvailable || 0
    };
};

/**
 * OPTIONAL (future-ready)
 * Reduce stock after purchase
 * This will be used in checkout service/controller
 */
exports.reduceStock = async (id, quantity) => {
    const product = await Product.findOne({ id });

    if (!product) return null;

    product.itemsAvailable = Math.max(
        0,
        product.itemsAvailable - quantity
    );

    await product.save();

    return product;
};