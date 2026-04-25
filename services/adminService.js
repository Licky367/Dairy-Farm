const Product = require("../models/Product");
const Order = require("../models/Order");
const User = require("../models/User");

/*=======================================
          GROUPED PRODUCTS (ADMIN VIEW)
=======================================*/
exports.getProductsGrouped = async () => {

    const products = await Product.find().sort({ createdAt: -1 });

    const grouped = {};

    products.forEach(p => {

        const majorCategory = p.majorCategory || "Uncategorized";
        const category = p.category || "General";

        if (!grouped[majorCategory]) {
            grouped[majorCategory] = {
                majorCategory,
                categories: {}
            };
        }

        if (!grouped[majorCategory].categories[category]) {
            grouped[majorCategory].categories[category] = {
                category,
                products: []
            };
        }

        grouped[majorCategory].categories[category].products.push(p);
    });

    return Object.values(grouped).map(group => ({
        majorCategory: group.majorCategory,
        categories: Object.values(group.categories)
    }));
};

/* ================= PRODUCT LIST ================= */
exports.getProducts = async () => {
    return await Product.find().sort({ createdAt: -1 });
};

/* ================= SINGLE PRODUCT ================= */
exports.getProduct = async (id) => {
    return await Product.findOne({ id });
};

/* ================= CREATE PRODUCT ================= */
exports.createProduct = async (data, file) => {

    const cost = Number(data.cost) || 0;
    const depositPercentage = Number(data.depositPercentage) || 0;
    const itemsAvailable = Number(data.itemsAvailable) || 0;
    const productUnits = Number(data.productUnits) || 0;

    const products = await Product.find({ category: data.category });

    if (!products.length) {
        throw new Error("Category does not exist");
    }

    let packages = [];

    products.forEach(p => {
        if (p.packages?.length) {
            p.packages.forEach(pkg => {
                packages.push({
                    ...pkg.toObject(),
                    parentId: p._id
                });
            });
        }
    });

    packages.sort(
        (a, b) => new Date(a._id.getTimestamp()) - new Date(b._id.getTimestamp())
    );

    let remainingNeeded = productUnits;
    let totalCost = 0;
    let allocations = [];

    for (let pkg of packages) {

        if (remainingNeeded <= 0) break;
        if (pkg.remainingUnits <= 0) continue;

        const takeUnits = Math.min(pkg.remainingUnits, remainingNeeded);
        const unitCost = pkg.BP / pkg.units;

        totalCost += takeUnits * unitCost;

        allocations.push({
            packageId: pkg._id,
            parentId: pkg.parentId,
            unitsTaken: takeUnits
        });

        await Product.updateOne(
            { _id: pkg.parentId, "packages._id": pkg._id },
            { $inc: { "packages.$.remainingUnits": -takeUnits } }
        );

        remainingNeeded -= takeUnits;
    }

    if (remainingNeeded > 0) {
        throw new Error("Not enough stock in category packages");
    }

    await Product.create({
        id: data.id,
        name: data.name,
        category: data.category,
        majorCategory: data.majorCategory || "Uncategorized",
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

/* ================= UPDATE PRODUCT ================= */
exports.updateProduct = async (id, data, file) => {

    const existingProduct = await Product.findOne({ id });

    if (!existingProduct) {
        throw new Error("Product not found");
    }

    const cost = Number(data.cost) || 0;
    const depositPercentage = Number(data.depositPercentage) || 0;
    const itemsAvailable = Number(data.itemsAvailable) || 0;
    const productUnits = Number(data.productUnits) || 0;

    /* RESTORE OLD STOCK */
    if (existingProduct.allocations?.length) {
        for (let alloc of existingProduct.allocations) {
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
    }

    /* RE-ALLOCATE */
    const products = await Product.find({ category: data.category });

    let packages = [];

    products.forEach(p => {
        if (p.packages?.length) {
            p.packages.forEach(pkg => {
                packages.push({
                    ...pkg.toObject(),
                    parentId: p._id
                });
            });
        }
    });

    packages.sort(
        (a, b) => new Date(a._id.getTimestamp()) - new Date(b._id.getTimestamp())
    );

    let remainingNeeded = productUnits;
    let totalCost = 0;
    let newAllocations = [];

    for (let pkg of packages) {

        if (remainingNeeded <= 0) break;
        if (pkg.remainingUnits <= 0) continue;

        const takeUnits = Math.min(pkg.remainingUnits, remainingNeeded);
        const unitCost = pkg.BP / pkg.units;

        totalCost += takeUnits * unitCost;

        newAllocations.push({
            packageId: pkg._id,
            parentId: pkg.parentId,
            unitsTaken: takeUnits
        });

        await Product.updateOne(
            { _id: pkg.parentId, "packages._id": pkg._id },
            { $inc: { "packages.$.remainingUnits": -takeUnits } }
        );

        remainingNeeded -= takeUnits;
    }

    if (remainingNeeded > 0) {
        throw new Error("Not enough stock in category packages");
    }

    const updateData = {
        name: data.name,
        category: data.category,
        majorCategory: data.majorCategory || "Uncategorized",
        cost,
        purchasePrice: totalCost,
        depositPercentage,
        depositAmount: (cost * depositPercentage) / 100,
        itemsAvailable,
        productUnits,
        allocations: newAllocations,
        description: data.description
    };

    if (file) {
        updateData.image = "/uploads/" + file.filename;
    }

    await Product.findOneAndUpdate({ id }, updateData, { new: true });
};

/* ================= DELETE PRODUCT ================= */
exports.deleteProduct = async (id) => {

    const product = await Product.findOne({ id });

    if (product?.allocations) {
        for (let alloc of product.allocations) {
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
    }

    await Product.findOneAndDelete({ id });
};

/*=======================================
          CATEGORY GROUPING (ADMIN)
=======================================*/
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
                        $multiply: ["$productUnits", "$itemsAvailable"]
                    }
                },
                packages: { $push: "$packages" }
            }
        }
    ]);

    return data.map(cat => {

        const allPackages = (cat.packages || []).flat();

        const totalUnits = allPackages.reduce(
            (sum, p) => sum + (p.units || 0),
            0
        );

        const remainingUnits = allPackages.reduce(
            (sum, p) => sum + (p.remainingUnits || 0),
            0
        );

        return {
            category: cat._id.category,
            majorCategory: cat._id.majorCategory || "Uncategorized",
            stockedUnits: cat.stockedUnits || 0,
            currentUnits: remainingUnits,
            totalUnits
        };
    });
};

/*=======================================
          DASHBOARD DATA
=======================================*/
exports.getDashboardData = async ({ month, year }) => {

    const now = new Date();

    const selectedYear = Number(year) || now.getFullYear();
    const selectedMonth = Number(month) || (now.getMonth() + 1);

    const monthStart = new Date(selectedYear, selectedMonth - 1, 1);
    const monthEnd = new Date(selectedYear, selectedMonth, 0, 23, 59, 59);

    const yearStart = new Date(selectedYear, 0, 1);
    const yearEnd = new Date(selectedYear, 11, 31, 23, 59, 59);

    const totalOrders = await Order.countDocuments({
        orderedAt: { $gte: monthStart, $lte: monthEnd }
    });

    const yearOrders = await Order.countDocuments({
        orderedAt: { $gte: yearStart, $lte: yearEnd }
    });

    const monthlyOrders = await Order.find({
        delivered: true,
        orderedAt: { $gte: monthStart, $lte: monthEnd }
    });

    const yearlyOrders = await Order.find({
        delivered: true,
        orderedAt: { $gte: yearStart, $lte: yearEnd }
    });

    const computeRevenue = (orders) => {
        let total = 0;

        orders.forEach(order => {

            const shipping = Number(order.shippingCost) || 0;

            order.items.forEach(item => {
                const cost = Number(item.cost) || 0;
                const purchasePrice = Number(item.purchasePrice) || 0;
                const qty = Number(item.quantity) || 0;

                total += (cost - purchasePrice) * qty;
            });

            total -= shipping;
        });

        return total;
    };

    const revenue = computeRevenue(monthlyOrders);
    const yearRevenue = computeRevenue(yearlyOrders);

    const totalClients = await User.countDocuments({ role: "client" });
    const totalProducts = await Product.countDocuments();

    const products = await Product.find();

    let totalItemsAvailable = 0;
    let lowStockCount = 0;

    products.forEach(p => {
        totalItemsAvailable += Number(p.itemsAvailable) || 0;

        if ((p.itemsAvailable || 0) > 0 && p.itemsAvailable <= 5) {
            lowStockCount++;
        }
    });

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