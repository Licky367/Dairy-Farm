const adminService = require("../services/adminService");

/**
 * GET /admin/dashboard
 */
exports.dashboard = async (req, res) => {
    try {

        const data = await adminService.getDashboardData(req.query);

        res.render("admin/dashboard", {
            ...data,
            query: req.query,
            user: req.user
        });

    } catch (err) {
        console.error(err);
        res.status(500).send("Error loading dashboard");
    }
};

/**
 * GET /admin/products
 */
exports.products = async (req, res) => {
    try {

        const products = await adminService.getProducts();

        res.render("admin/products", {
            products,
            user: req.user
        });

    } catch (err) {
        console.error(err);
        res.status(500).send("Error loading products");
    }
};

/**
 * GET /admin/products/create
 */
exports.createProductPage = (req, res) => {
    res.render("admin/product/create", {
        user: req.user
    });
};

/**
 * POST /admin/products/create
 */
exports.createProduct = async (req, res) => {
    try {

        await adminService.createProduct(req.body, req.file);

        res.redirect("/admin/products");

    } catch (err) {
        console.error(err);
        res.status(500).send("Error creating product");
    }
};

/**
 * GET /admin/products/edit/:id
 */
exports.editProductPage = async (req, res) => {
    try {

        const product = await adminService.getProduct(req.params.id);

        res.render("admin/product/edit", {
            product,
            user: req.user
        });

    } catch (err) {
        console.error(err);
        res.status(500).send("Error loading product");
    }
};

/**
 * POST /admin/products/edit/:id
 */
exports.updateProduct = async (req, res) => {
    try {

        await adminService.updateProduct(
            req.params.id,
            req.body,
            req.file
        );

        res.redirect("/admin/products");

    } catch (err) {
        console.error(err);
        res.status(500).send("Error updating product");
    }
};

/**
 * POST /admin/products/delete/:id
 */
exports.deleteProduct = async (req, res) => {
    try {

        await adminService.deleteProduct(req.params.id);

        res.redirect("/admin/products");

    } catch (err) {
        console.error(err);
        res.status(500).send("Error deleting product");
    }
};