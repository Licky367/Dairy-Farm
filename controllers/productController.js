const productService = require("../services/productService");

exports.productDetails = async (req, res) => {
    const product = await productService.getProductById(req.params.id);

    if (!product) return res.send("Product not found");

    res.render("product", {
        product,
        user: req.session.user || null
    });
};