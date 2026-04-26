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
exports.getCreatePage = async (req, res) => {
try {
const categories = await categoryService.getAllCategories();

/* UNIQUE EXISTING majorCategory VALUES */
const majorCategories = [
...new Set(
categories
.map(item => item.majorCategory)
.filter(Boolean)
)
].sort();

res.render("categoryCreate", { majorCategories });

} catch (error) {
console.error(error);
res.status(500).send("Server Error");
}
};

/* CREATE CATEGORY */
exports.createCategory = async (req, res) => {
try {
let { category, packageUnits, BP, majorCategory } = req.body;

/* CLEAN INPUT */
majorCategory = majorCategory ? majorCategory.trim() : "";
category = category ? category.trim() : "";

/* GET EXISTING majorCategory LIST */
const categories = await categoryService.getAllCategories();

const existingMajorCategories = categories
.map(item => item.majorCategory)
.filter(Boolean);

/* CHECK IF USER TYPED A NEW DUPLICATE */
const alreadyExists = existingMajorCategories.some(
item => item.toLowerCase() === majorCategory.toLowerCase()
);

/*
If majorCategory already exists:
- Accept it (dropdown selection or typed exact existing)
If not exists:
- Allow as brand new unique value
Empty value rejected
*/

if (!majorCategory) {
return res.status(400).send("Major category is required");
}

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