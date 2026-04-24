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

/* collect all packages */
packages: { $push: "$packages" }
}
}
]);

return data.map(cat => {

const stockedUnits = cat.stockedUnits || 0;

/* flatten all packages */
const allPackages = (cat.packages || []).flat();

/* total units from all packages */
const totalUnits = allPackages.reduce((sum, pkg) => {
return sum + (pkg.units || 0);
}, 0);

/* remaining units */
const remainingUnits = allPackages.reduce((sum, pkg) => {
return sum + (pkg.remainingUnits || 0);
}, 0);

/* your logic */
const currentUnits = remainingUnits;

return {
category: cat._id,
stockedUnits,
currentUnits
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

/* NEW STRUCTURE */
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

/* push new batch instead of incrementing */
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