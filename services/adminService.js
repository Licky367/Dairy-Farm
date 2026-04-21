const Product = require("../models/Product");

exports.getProducts = async () => {
    return await Product.find().sort({ createdAt: -1 });
};

exports.getProduct = async (id) => {
    return await Product.findOne({ id });
};

exports.createProduct = async (data, file) => {
    const cost = Number(data.cost) || 0;
    const depositPercentage =
        Number(data.depositPercentage) || 0;
    const itemsAvailable =
        Number(data.itemsAvailable) || 0;

    const purchasePrice =
        Number(data.purchasePrice) || 0;

    await Product.create({
        id: data.id,
        name: data.name,
        category: data.category,
        image: file ? "/uploads/" + file.filename : "",
        cost: cost,
        purchasePrice: purchasePrice, // ✅ ADDED ONLY
        depositPercentage: depositPercentage,
        depositAmount:
            (cost * depositPercentage) / 100,
        itemsAvailable: itemsAvailable,
        description: data.description
    });
};

exports.updateProduct = async (id, data, file) => {
    const cost = Number(data.cost) || 0;
    const depositPercentage =
        Number(data.depositPercentage) || 0;
    const itemsAvailable =
        Number(data.itemsAvailable) || 0;

    const purchasePrice =
        Number(data.purchasePrice) || 0;

    const updateData = {
        name: data.name,
        category: data.category,
        cost: cost,
        purchasePrice: purchasePrice, // ✅ ADDED ONLY
        depositPercentage: depositPercentage,
        depositAmount:
            (cost * depositPercentage) / 100,
        itemsAvailable: itemsAvailable,
        description: data.description
    };

    if (file) {
        updateData.image =
            "/uploads/" + file.filename;
    }

    await Product.findOneAndUpdate(
        { id },
        updateData,
        { new: true }
    );
};

exports.deleteProduct = async (id) => {
    await Product.findOneAndDelete({ id });
};