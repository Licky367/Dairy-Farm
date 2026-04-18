const Product = require("../models/Product");

exports.dashboard = (req, res) => {
    res.render("admin/dashboard");
};

// list products
exports.products = async (req, res) => {
    const products = await Product.find();
    res.render("admin/products", { products });
};

// edit page
exports.editProductPage = async (req, res) => {
    const product = await Product.findOne({ id: req.params.id });

    if (!product) return res.send("Product not found");

    res.render("admin/adminProduct", { product });
};

// update product
exports.updateProduct = async (req, res) => {
    const { name, description, image, cost, category, depositPercentage } = req.body;

    const depositAmount = (cost * depositPercentage) / 100;

    await Product.findOneAndUpdate(
        { id: req.params.id },
        {
            name,
            description,
            image,
            cost,
            category,
            depositPercentage,
            depositAmount
        }
    );

    res.redirect("/admin/products");
};