const clientService = require("../services/clientService");

/* ================= LIST PAGE ================= */
exports.clientPage = async (req, res) => {
    try {
        const products = await clientService.getAllProducts();

        const groupedProducts = {};

        for (let product of products) {
            if (!groupedProducts[product.category]) {
                groupedProducts[product.category] = [];
            }
            groupedProducts[product.category].push(product);
        }

        res.render("client", {
            products,           // optional (keep if you may need it later)
            groupedProducts,    // ✅ primary data for the view
            user: req.session.user || null
        });

    } catch (err) {
        console.error("Client Page Error:", err);
        res.status(500).send("Server Error");
    }
};


/* ================= PRODUCT VIEW ================= */
exports.viewProductPage = async (req, res) => {
    try {
        const productId = req.params.id;

        const product = await clientService.getProductById(productId);

        if (!product) {
            return res.status(404).send("Product not found");
        }

        res.render("client-view", {
            product,
            user: req.session.user || null
        });

    } catch (err) {
        console.error("View Product Error:", err);
        res.status(500).send("Server Error");
    }
};