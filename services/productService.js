const Product = require("../models/Product");

exports.getProductById = async (id) => {
    return await Product.findOne({ id });
};