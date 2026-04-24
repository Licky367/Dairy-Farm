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

/* take latest packageUnits */
packageUnits: { $sum: "$packageUnits" }
}
}
]);

/* compute currentUnits manually */
return data.map(cat => {

const stockedUnits = cat.stockedUnits || 0;
const packageUnits = cat.packageUnits || 0;

/* your logic */
const totalUnits = packageUnits; 
const currentUnits = totalUnits - stockedUnits;

return {
category: cat._id,
stockedUnits,
currentUnits
};
});
};

/* CREATE CATEGORY (NO PRODUCT CREATION AS YOU INSISTED) */
exports.createCategory = async ({ category, packageUnits, BP }) => {

/*
Since we are NOT creating a product,
we store category info by inserting ONE minimal product record.
This is the only way using Product model.
*/

await Product.create({
id: `CAT-${Date.now()}`,
name: `${category}-base`,
category,
cost: 0,
depositPercentage: 0,
description: "Category base record",

productUnits: 0,
itemsAvailable: 0,

packageUnits: Number(packageUnits),
BP: Number(BP)
});
};

/* RESTOCK CATEGORY */
exports.restockCategory = async ({ category, packageUnits, BP }) => {

/* ADD to existing packageUnits */
await Product.updateMany(
{ category },
{
$inc: { packageUnits: Number(packageUnits) },
$set: { BP: Number(BP) }
}
);

};