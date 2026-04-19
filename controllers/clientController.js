const clientService = require("../services/clientService");

exports.clientPage = async (req, res) => {
    const products = await clientService.getAllProducts();

    const grouped = {};

    for (let product of products) {
        if (!grouped[product.category]) {
            grouped[product.category] = [];
        }
        grouped[product.category].push(product);
    }

    res.render("client", {
        groupedProducts: grouped,
        user: req.session.user || null
    });
};