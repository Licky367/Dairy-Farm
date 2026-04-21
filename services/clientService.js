const Product = require("../models/Product");

/**
 * Get all products for client view
 * Includes stock-aware safe mapping
 */
exports.getAllProducts = async () => {
    const products = await Product.find({}).lean();

    return products.map(p => ({
        id: p.id,
        name: p.name,
        category: p.category,
        image: p.image,
        cost: p.cost,
        depositPercentage: p.depositPercentage,
        depositAmount: p.depositAmount,
        description: p.description,

        // 🔥 IMPORTANT: stock field used in UI upgrades
        itemsAvailable: p.itemsAvailable || 0
    }));
};

/**
 * Get single product for product page
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
        itemsAvailable: product.itemsAvailable || 0
    };
};

/**
 * Reduce stock after purchase (USED IN CHECKOUT)
 * This is critical for "auto stock update"
 */
exports.reduceStock = async (items = []) => {
    for (const item of items) {
        const product = await Product.findOne({ id: item.id });

        if (!product) continue;

        const newStock = Math.max(0, product.itemsAvailable - item.quantity);

        product.itemsAvailable = newStock;

        await product.save();
    }
};