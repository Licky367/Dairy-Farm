const Product = require("../models/Product");

exports.getAllProducts = async () => {
    return await Product.find({});
};