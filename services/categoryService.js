const Product = require("../models/Product");

/* ================= GET ALL CATEGORIES WITH CALCULATIONS ================= */
exports.getAllCategories = async () => {

const data = await Product.aggregate([

/* GROUP BY majorCategory + category */
{
$group: {
_id: {
category: "$category",
majorCategory: "$majorCategory"
},

/* TOTAL MARKETED UNITS */
stockedUnits: {
$sum: {
$multiply: [
{ $ifNull: ["$productUnits", 0] },
{ $ifNull: ["$itemsAvailable", 0] }
]
}
},

/* COLLECT PACKAGE ARRAYS */
packages: {
$push: {
$ifNull: ["$packages", []]
}
}
}
},

/* SORT RESULTS */
{
$sort: {
"_id.majorCategory": 1,
"_id.category": 1
}
}

]);

return data.map(cat => {

const stockedUnits = Number(cat.stockedUnits) || 0;

/* SAFELY FLATTEN PACKAGES */
const allPackages = (cat.packages || [])
.flat()
.filter(Boolean);

/* TOTAL UNITS EVER STOCKED */
const totalUnits = allPackages.reduce((sum, pkg) => {
return sum + (Number(pkg.units) || 0);
}, 0);

/* CURRENT REMAINING UNITS */
const currentUnits = allPackages.reduce((sum, pkg) => {
return sum + (Number(pkg.remainingUnits) || 0);
}, 0);

return {
category: cat._id.category,
majorCategory: cat._id.majorCategory || "Uncategorized",
stockedUnits,
currentUnits,
totalUnits
};

});

};

/* ================= CREATE CATEGORY ================= */
exports.createCategory = async ({
category,
packageUnits,
BP,
majorCategory
}) => {

const cleanCategory = category ? category.trim() : "";
const cleanMajorCategory = majorCategory ? majorCategory.trim() : "";

if (!cleanCategory) {
throw new Error("Category name is required");
}

if (!cleanMajorCategory) {
throw new Error("Major category is required");
}

/* CHECK IF CATEGORY ALREADY EXISTS UNDER SAME MAJOR CATEGORY */
const existingCategory = await Product.findOne({
category: new RegExp(`^${cleanCategory}$`, "i"),
majorCategory: new RegExp(`^${cleanMajorCategory}$`, "i")
});

if (existingCategory) {
throw new Error("Category already exists under this major category");
}

/* CREATE NEW CATEGORY RECORD */
const packageQty = Number(packageUnits) || 0;
const buyingPrice = Number(BP) || 0;

const newCategory = new Product({
category: cleanCategory,
majorCategory: cleanMajorCategory,
productUnits: 1,
itemsAvailable: packageQty,
packages: [
{
units: packageQty,
remainingUnits: packageQty,
BP: buyingPrice
}
]
});

await newCategory.save();

return newCategory;

};

/* ================= RESTOCK CATEGORY ================= */
exports.restockCategory = async ({
category,
packageUnits,
BP
}) => {

const packageQty = Number(packageUnits) || 0;
const buyingPrice = Number(BP) || 0;

const product = await Product.findOne({
category: category
});

if (!product) {
throw new Error("Category not found");
}

/* ADD NEW PACKAGE */
product.packages.push({
units: packageQty,
remainingUnits: packageQty,
BP: buyingPrice
});

/* UPDATE AVAILABLE ITEMS */
product.itemsAvailable =
(Number(product.itemsAvailable) || 0) + packageQty;

await product.save();

return product;

};