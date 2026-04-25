const categoryService = require("../services/categoryService");

/* GET CATEGORY PAGE */
exports.getCategories = async (req, res) => {
try {
const categories = await categoryService.getAllCategories();

/* GROUP BY majorCategory (VIEW TRANSFORMATION ONLY) */
const groupedMap = {};

categories.forEach(cat => {
const key = cat.majorCategory || "Uncategorized";

if (!groupedMap[key]) {
groupedMap[key] = {
majorCategory: key,
categories: []
};
}

groupedMap[key].categories.push(cat);
});

const groupedCategories = Object.values(groupedMap);

res.render("category", { groupedCategories });

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
const { category, packageUnits, BP, majorCategory } = req.body;

await categoryService.createCategory({
category,
packageUnits,
BP,
majorCategory
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