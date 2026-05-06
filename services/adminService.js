const Product = require("../models/Product");
const Order = require("../models/Order");
const User = require("../models/User");

/* =======================================
   PAID FILTER
======================================= */
const paidFilter = {
    status: { $in: ["paid", "paid(cash)"] }
};

/* =======================================
   DATE HELPERS
======================================= */
function getDateRange(month, year) {
    const now = new Date();

    const selectedYear = Number(year) || now.getFullYear();
    const selectedMonth = Number(month) || (now.getMonth() + 1);

    const start = new Date(selectedYear, selectedMonth - 1, 1);
    const end = new Date(selectedYear, selectedMonth, 0, 23, 59, 59);

    return {
        start,
        end,
        selectedMonth,
        selectedYear
    };
}

function getYearRange(year) {
    const now = new Date();

    const selectedYear = Number(year) || now.getFullYear();

    const start = new Date(selectedYear, 0, 1);
    const end = new Date(selectedYear, 11, 31, 23, 59, 59);

    return {
        start,
        end,
        selectedYear
    };
}

/* =======================================
   GROUPED PRODUCTS
======================================= */
exports.getProductsGrouped = async () => {
    const products = await Product.find().sort({ createdAt: -1 });

    const grouped = {};

    for (const product of products) {
        const major = product.majorCategory || "Uncategorized";
        const category = product.category || "General";

        if (!grouped[major]) {
            grouped[major] = {
                majorCategory: major,
                categories: {}
            };
        }

        if (!grouped[major].categories[category]) {
            grouped[major].categories[category] = {
                category,
                products: []
            };
        }

        grouped[major].categories[category].products.push(product);
    }

    return Object.values(grouped).map(group => ({
        majorCategory: group.majorCategory,
        categories: Object.values(group.categories)
    }));
};

/* =======================================
   GET PRODUCTS
======================================= */
exports.getProducts = async () => {
    return await Product.find().sort({ createdAt: -1 });
};

/* =======================================
   GET PRODUCT
======================================= */
exports.getProduct = async (id) => {
    return await Product.findOne({ id });
};

/* =======================================
   STOCK PACKAGES
======================================= */
const getStockPackages = async (category, majorCategory) => {
    const products = await Product.find({ category, majorCategory });

    const packages = [];

    for (const product of products) {
        for (const pkg of product.packages || []) {
            packages.push({
                ...pkg.toObject(),
                parentId: product._id
            });
        }
    }

    return packages.sort(
        (a, b) =>
            new Date(a._id.getTimestamp()) -
            new Date(b._id.getTimestamp())
    );
};

/* =======================================
   FIFO STOCK ALLOCATION
======================================= */
const allocateStock = async (packages, productUnits) => {
    let remaining = Number(productUnits) || 0;
    let totalCost = 0;
    const allocations = [];

    for (const pkg of packages) {
        if (remaining <= 0) break;
        if ((pkg.remainingUnits || 0) <= 0) continue;

        const take = Math.min(pkg.remainingUnits, remaining);
        const unitCost =
            (Number(pkg.BP) || 0) / (Number(pkg.units) || 1);

        totalCost += take * unitCost;

        allocations.push({
            packageId: pkg._id,
            parentId: pkg.parentId,
            unitsTaken: take
        });

        await Product.updateOne(
            {
                _id: pkg.parentId,
                "packages._id": pkg._id
            },
            {
                $inc: {
                    "packages.$.remainingUnits": -take
                }
            }
        );

        remaining -= take;
    }

    if (remaining > 0) {
        throw new Error("Not enough stock in category packages");
    }

    return {
        totalCost,
        allocations
    };
};

/* =======================================
   RESTORE ALLOCATIONS
======================================= */
const restoreAllocations = async (allocations = []) => {
    for (const alloc of allocations) {
        await Product.updateOne(
            {
                _id: alloc.parentId,
                "packages._id": alloc.packageId
            },
            {
                $inc: {
                    "packages.$.remainingUnits": alloc.unitsTaken
                }
            }
        );
    }
};

/* =======================================
   CREATE PRODUCT
======================================= */
exports.createProduct = async (data, file) => {
    const cost = Number(data.cost) || 0;
    const depositPercentage = Number(data.depositPercentage) || 0;
    const itemsAvailable = Number(data.itemsAvailable) || 0;
    const productUnits = Number(data.productUnits) || 0;

    const majorCategory = data.majorCategory || "Uncategorized";

    const packages = await getStockPackages(
        data.category,
        majorCategory
    );

    const { totalCost, allocations } = await allocateStock(
        packages,
        productUnits
    );

    await Product.create({
        id: data.id,
        name: data.name,
        category: data.category,
        majorCategory,
        image: file ? "/uploads/" + file.filename : "",
        cost,
        purchasePrice: totalCost,
        depositPercentage,
        depositAmount: (cost * depositPercentage) / 100,
        itemsAvailable,
        productUnits,
        allocations,
        description: data.description
    });
};

/* =======================================
   UPDATE PRODUCT
======================================= */
exports.updateProduct = async (id, data, file) => {
    const existing = await Product.findOne({ id });

    if (!existing) {
        throw new Error("Product not found");
    }

    const cost = Number(data.cost) || 0;
    const depositPercentage = Number(data.depositPercentage) || 0;
    const itemsAvailable = Number(data.itemsAvailable) || 0;
    const productUnits = Number(data.productUnits) || 0;

    const majorCategory = data.majorCategory || "Uncategorized";

    await restoreAllocations(existing.allocations);

    const packages = await getStockPackages(
        data.category,
        majorCategory
    );

    const { totalCost, allocations } = await allocateStock(
        packages,
        productUnits
    );

    const updateData = {
        name: data.name,
        category: data.category,
        majorCategory,
        cost,
        purchasePrice: totalCost,
        depositPercentage,
        depositAmount: (cost * depositPercentage) / 100,
        itemsAvailable,
        productUnits,
        allocations,
        description: data.description
    };

    if (file) {
        updateData.image = "/uploads/" + file.filename;
    }

    await Product.findOneAndUpdate(
        { id },
        updateData,
        { new: true }
    );
};

/* =======================================
   DELETE PRODUCT
======================================= */
exports.deleteProduct = async (id) => {
    const product = await Product.findOne({ id });

    if (!product) return;

    await restoreAllocations(product.allocations);

    await Product.findOneAndDelete({ id });
};

/* =======================================
   CATEGORY GROUPING
======================================= */
exports.getCategories = async () => {
    const data = await Product.aggregate([
        {
            $group: {
                _id: {
                    category: "$category",
                    majorCategory: "$majorCategory"
                },
                stockedUnits: {
                    $sum: {
                        $multiply: [
                            "$productUnits",
                            "$itemsAvailable"
                        ]
                    }
                },
                packages: {
                    $push: "$packages"
                }
            }
        }
    ]);

    return data.map(category => {
        const allPackages = (category.packages || []).flat();

        const totalUnits = allPackages.reduce(
            (sum, pkg) => sum + (Number(pkg.units) || 0),
            0
        );

        const remainingUnits = allPackages.reduce(
            (sum, pkg) => sum + (Number(pkg.remainingUnits) || 0),
            0
        );

        return {
            category: category._id.category,
            majorCategory:
                category._id.majorCategory || "Uncategorized",
            stockedUnits: category.stockedUnits || 0,
            currentUnits: remainingUnits,
            totalUnits
        };
    });
};

/* =======================================
   REVENUE
======================================= */
const computeRevenue = (orders = []) => {
    let revenue = 0;

    for (const order of orders) {
        revenue += Number(order.totalRevenue) || 0;
    }

    return revenue;
};

/* =======================================
   DASHBOARD
======================================= */
exports.getDashboardData = async ({ month, year }) => {
    const {
        start: monthStart,
        end: monthEnd
    } = getDateRange(month, year);

    const {
        start: yearStart,
        end: yearEnd
    } = getYearRange(year);

    /* ---------------------------
       ORDER COUNTS (NO FILTER)
    --------------------------- */
    const totalOrders = await Order.countDocuments({
        orderedAt: {
            $gte: monthStart,
            $lte: monthEnd
        }
    });

    const yearOrders = await Order.countDocuments({
        orderedAt: {
            $gte: yearStart,
            $lte: yearEnd
        }
    });

    /* ---------------------------
       REVENUE (PAID ONLY)
    --------------------------- */
    const monthlyOrders = await Order.find({
        ...paidFilter,
        orderedAt: {
            $gte: monthStart,
            $lte: monthEnd
        }
    });

    const yearlyOrders = await Order.find({
        ...paidFilter,
        orderedAt: {
            $gte: yearStart,
            $lte: yearEnd
        }
    });

    const revenue = computeRevenue(monthlyOrders);
    const yearRevenue = computeRevenue(yearlyOrders);

    const totalClients = await User.countDocuments({
        role: "client"
    });

    const totalProducts = await Product.countDocuments();

    const products = await Product.find();

    let totalItemsAvailable = 0;
    let lowStockCount = 0;

    for (const product of products) {
        const items = Number(product.itemsAvailable) || 0;

        totalItemsAvailable += items;

        if (items > 0 && items <= 5) {
            lowStockCount++;
        }
    }

    const recentOrders = await Order.find()
        .sort({ createdAt: -1 })
        .limit(10);

    return {
        totalProducts,
        totalOrders,
        yearOrders,
        revenue,
        yearRevenue,
        totalClients,
        totalItemsAvailable,
        lowStockCount,
        recentOrders
    };
};