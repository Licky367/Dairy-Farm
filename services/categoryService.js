const Product = require("../models/Product");

/* ================= GET ALL CATEGORIES WITH CALCULATIONS ================= */
exports.getAllCategories = async () => {

const data = await Product.aggregate([

/* group by majorCategory + category */
{
$group: {
_id: {
category: "$category",
majorCategory: "$majorCategory"
},

/* total marketed units */
stockedUnits: {
$sum: {
$multiply: ["$productUnits", "$itemsAvailable"]
}
},

/* flatten packages properly */
packages: {
$push: "$packages"
}
}
}

]);

return data.map(cat => {

const stockedUnits = cat.stockedUnits || 0;

/* safely flatten packages */
const allPackages = (cat.packages || []).flat().filter(Boolean);

/* total units ever stocked */
const totalUnits = allPackages.reduce((sum, pkg) => {
return sum + (Number(pkg.units) || 0);
}, 0);

/* real stock */
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