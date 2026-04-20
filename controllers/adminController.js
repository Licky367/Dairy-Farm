const adminService = require("../services/adminService");

exports.dashboard = (req, res) => {
    res.render("admin/dashboard");
};

exports.products = async (req, res) => {
    const products = await adminService.getProducts();
    res.render("admin/products", { products });
};

exports.createProductPage = (req, res) => {
    res.render("admin/product/create");
};

exports.createProduct = async (req, res) => {
    await adminService.createProduct(req.body, req.file);
    res.redirect("/admin/products");
};

exports.editProductPage = async (req, res) => {
    const product = await adminService.getProduct(req.params.id);
    res.render("admin/product/edit", { product });
};

exports.updateProduct = async (req, res) => {
    await adminService.updateProduct(req.params.id, req.body, req.file);
    res.redirect("/admin/products");
};

exports.deleteProduct = async (req, res) => {
    await adminService.deleteProduct(req.params.id);
    res.redirect("/admin/products");
};