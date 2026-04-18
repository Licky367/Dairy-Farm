const Order = require("../models/Order");
const Product = require("../models/Product");

exports.dashboard = (req, res) => {
    res.render("admin/dashboard");
};

exports.orders = async (req, res) => {
    const orders = await Order.find();
    res.render("admin/orders", { orders });
};

exports.products = async (req, res) => {
    const products = await Product.find();
    res.render("admin/products", { products });
};