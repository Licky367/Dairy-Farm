const Product = require("../models/Product");

/* ================= GET ALL PRODUCTS ================= */
exports.getAllProducts = async () => {
    const products = await Product.find({}).lean();

    return products.map(p => ({
        id: p.id || p._id.toString(),
        name: p.name,
        category: p.category,
        image: p.image,
        cost: p.cost,
        depositPercentage: p.depositPercentage,
        depositAmount: p.depositAmount,
        description: p.description,
        itemsAvailable: p.itemsAvailable || 0
    }));
};


/* ================= GET SINGLE PRODUCT ================= */
exports.getProductById = async (id) => {
    const product = await Product.findOne({
        $or: [
            { id },
            { _id: id }
        ]
    }).lean();

    if (!product) return null;

    return {
        id: product.id || product._id.toString(),
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


/* ================= REDUCE STOCK ================= */
exports.reduceStock = async (items = []) => {
    for (const item of items) {
        const product = await Product.findOne({
            $or: [
                { id: item.id },
                { _id: item.id }
            ]
        });

        if (!product) continue;

        const newStock = Math.max(0, product.itemsAvailable - item.quantity);

        product.itemsAvailable = newStock;

        await product.save();
    }
};