const clientService = require("../services/clientService");

/* ================= LIST PAGE ================= */
exports.clientPage = async (req, res) => {
    try {
        const products = await clientService.getAllProducts();

        /* ================= GROUP BY majorCategory → category ================= */
        const grouped = {};

        for (let product of products) {

            const majorCategory = product.majorCategory || "Uncategorized";
            const category = product.category || "General";

            /* create majorCategory group */
            if (!grouped[majorCategory]) {
                grouped[majorCategory] = {
                    majorCategory,
                    categories: {}
                };
            }

            /* create category group inside majorCategory */
            if (!grouped[majorCategory].categories[category]) {
                grouped[majorCategory].categories[category] = {
                    category,
                    products: []
                };
            }

            /* push product into correct bucket */
            grouped[majorCategory].categories[category].products.push(product);
        }

        /* convert object → array (EJS friendly) */
        const groupedProducts = Object.values(grouped).map(group => ({
            majorCategory: group.majorCategory,
            categories: Object.values(group.categories)
        }));

        res.render("client", {
            products,            // optional fallback
            groupedProducts,     // main structured data
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