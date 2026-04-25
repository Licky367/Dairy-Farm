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

        const groupedProducts = await adminService.getProductsGrouped();

        res.render("admin/products", {
            groupedProducts,
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
exports.createProductPage = async (req, res) => {
    try {

        const [categories, majorCategories] = await Promise.all([
            adminService.getCategories(),
            adminService.getMajorCategories() // 🔥 NEW REQUIRED SERVICE METHOD
        ]);

        res.render("admin/product/create", {
            user: req.user,
            categories,
            majorCategories // ✅ ADDED
        });

    } catch (err) {
        console.error(err);
        res.status(500).send("Error loading create product page");
    }
};

/**
 * POST /admin/products/create
 */
exports.createProduct = async (req, res) => {
    try {

        const { itemsAvailable, productUnits, currentUnits } = req.body;

        const totalUnits = Number(itemsAvailable) * Number(productUnits);

        if (totalUnits > Number(currentUnits)) {

            const [categories, majorCategories] = await Promise.all([
                adminService.getCategories(),
                adminService.getMajorCategories()
            ]);

            return res.status(400).render("admin/product/create", {
                user: req.user,
                categories,
                majorCategories, // ✅ ADDED
                error: "Total units (itemsAvailable × productUnits) cannot exceed current units"
            });
        }

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

        const [product, categories, majorCategories] = await Promise.all([
            adminService.getProduct(req.params.id),
            adminService.getCategories(),
            adminService.getMajorCategories() // 🔥 NEW
        ]);

        res.render("admin/product/edit", {
            product,
            categories,
            majorCategories, // ✅ ADDED
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

        const { itemsAvailable, productUnits, currentUnits } = req.body;

        const totalUnits = Number(itemsAvailable) * Number(productUnits);

        if (totalUnits > Number(currentUnits)) {

            const [product, categories, majorCategories] = await Promise.all([
                adminService.getProduct(req.params.id),
                adminService.getCategories(),
                adminService.getMajorCategories()
            ]);

            return res.status(400).render("admin/product/edit", {
                product,
                categories,
                majorCategories, // ✅ ADDED
                user: req.user,
                error: "Total units (itemsAvailable × productUnits) cannot exceed current units"
            });
        }

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