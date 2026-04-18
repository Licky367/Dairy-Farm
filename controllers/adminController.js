const Product = require("../models/Product");

exports.dashboard = (req, res) => {
    res.render("admin/dashboard");
};

exports.products = async (req, res) => {
    const products = await Product.find();
    res.render("admin/products", { products });
};

exports.editProductPage = async (req, res) => {
    const product = await Product.findOne({ id: req.params.id });

    if (!product) return res.send("Product not found");

    res.render("admin/editProduct", { product });
};

exports.updateProduct = async (req, res) => {
    const {
        name,
        category,
        cost,
        description,
        depositPercentage
    } = req.body;

    const updateData = {
        name,
        category,
        cost,
        description,
        depositPercentage,
        depositAmount: (cost * depositPercentage) / 100
    };

    // if new image uploaded
    if (req.file) {
        updateData.image = "/uploads/" + req.file.filename;
    }

    await Product.findOneAndUpdate(
        { id: req.params.id },
        updateData
    );

    res.redirect("/admin/products");
};