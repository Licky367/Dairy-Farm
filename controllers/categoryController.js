const categoryService = require("../services/categoryService");

/* GET CATEGORY PAGE */
exports.getCategories = async (req, res) => {
try {
const categories = await categoryService.getAllCategories();

res.render("category", { categories });
} catch (error) {
console.error(error);
res.status(500).send("Server Error");
}
};

/* GET CREATE PAGE */
exports.getCreatePage = (req, res) => {
res.render("categoryCreate");
};

/* CREATE CATEGORY */
exports.createCategory = async (req, res) => {
try {
const { category, packageUnits, BP } = req.body;

await categoryService.createCategory({
category,
packageUnits,
BP
});

res.redirect("/category");
} catch (error) {
console.error(error);
res.status(500).send("Error creating category");
}
};

/* RESTOCK CATEGORY */
exports.restockCategory = async (req, res) => {
try {
const { category, packageUnits, BP } = req.body;

await categoryService.restockCategory({
category,
packageUnits,
BP
});

res.redirect("/category");
} catch (error) {
console.error(error);
res.status(500).send("Error restocking category");
}
};