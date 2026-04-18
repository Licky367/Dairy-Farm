const Product = require("../models/Product");

exports.getProducts = async () => {
    return await Product.find();
};

exports.getProduct = async (id) => {
    return await Product.findOne({ id });
};

exports.createProduct = async (data, file) => {
    await Product.create({
        id: data.id,
        name: data.name,
        category: data.category,
        image: file ? "/uploads/" + file.filename : "",
        cost: data.cost,
        depositPercentage: data.depositPercentage,
        depositAmount:
            (data.cost * data.depositPercentage) / 100,
        description: data.description
    });
};

exports.updateProduct = async (id, data, file) => {
    const updateData = {
        name: data.name,
        category: data.category,
        cost: data.cost,
        depositPercentage: data.depositPercentage,
        depositAmount:
            (data.cost * data.depositPercentage) / 100,
        description: data.description
    };

    if (file) {
        updateData.image =
            "/uploads/" + file.filename;
    }

    await Product.findOneAndUpdate({ id }, updateData);
};

exports.deleteProduct = async (id) => {
    await Product.findOneAndDelete({ id });
};