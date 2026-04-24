const Product = require("../models/Product");

/* GET ALL CATEGORIES WITH CALCULATIONS */
exports.getAllCategories = async () => {

const data = await Product.aggregate([
{
$group: {
_id: "$category",

/* total marketed units */
stockedUnits: {
$sum: {
$multiply: ["$productUnits", "$itemsAvailable"]
}
},

/* collect all packages safely */
packages: {
$push: {
$ifNull: ["$packages", []]
}
}
}
}
]);

return data.map(cat => {

const stockedUnits = cat.stockedUnits || 0;

/* flatten all packages safely */
const allPackages = [].concat(...cat.packages);

/* total units ever stocked */
const totalUnits = allPackages.reduce((sum, pkg) => {
return sum + (Number(pkg.units) || 0);
}, 0);

/* ✅ REAL STOCK (SOURCE OF TRUTH) */
const currentUnits = allPackages.reduce((sum, pkg) => {
return sum + (Number(pkg.remainingUnits) || 0);
}, 0);

return {
category: cat._id,
stockedUnits,
currentUnits,
totalUnits   // ✅ IMPORTANT: now returned
};
});
};

/* CREATE CATEGORY */
exports.createCategory = async ({ category, packageUnits, BP }) => {

await Product.create({
id: `CAT-${Date.now()}`,
name: `${category}-base`,
category,
cost: 0,
depositPercentage: 0,
description: "Category base record",

productUnits: 0,
itemsAvailable: 0,

/* FIFO PACKAGES */
packages: [
{
units: Number(packageUnits),
BP: Number(BP),
remainingUnits: Number(packageUnits)
}
]
});
};

/* RESTOCK CATEGORY (FIFO SAFE) */
exports.restockCategory = async ({ category, packageUnits, BP }) => {

await Product.updateMany(
{ category },
{
$push: {
packages: {
units: Number(packageUnits),
BP: Number(BP),
remainingUnits: Number(packageUnits)
}
}
}
);

};