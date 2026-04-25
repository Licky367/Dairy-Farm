const Product = require("../models/Product");
const Order = require("../models/Order");
const User = require("../models/User");

/* =======================================
        GROUPED PRODUCTS (ADMIN)
   majorCategory → category → products
======================================= */
exports.getProductsGrouped = async () => {

    const products = await Product.find().sort({ createdAt: -1 });

    const grouped = {};

    products.forEach(p => {

        const major = p.majorCategory || "Uncategorized";
        const cat = p.category || "General";

        if (!grouped[major]) {
            grouped[major] = {
                majorCategory: major,
                categories: {}
            };
        }

        if (!grouped[major].categories[cat]) {
            grouped[major].categories[cat] = {
                category: cat,
                products: []
            };
        }

        grouped[major].categories[cat].products.push(p);
    });

    return Object.values(grouped).map(group => ({
        majorCategory: group.majorCategory,
        categories: Object.values(group.categories)
    }));
};


/* =======================================
        GET PRODUCTS (RAW)
======================================= */
exports.getProducts = async () => {
    return await Product.find().sort({ createdAt: -1 });
};


/* =======================================
        GET SINGLE PRODUCT
======================================= */
exports.getProduct = async (id) => {
    return await Product.findOne({ id });
};


/* =======================================
        STOCK FETCH (SAFE)
======================================= */
const getStockPackages = async (category, majorCategory) => {

    const products = await Product.find({ category, majorCategory });

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

    return packages.sort(
        (a, b) => new Date(a._id.getTimestamp()) - new Date(b._id.getTimestamp())
    );
};


/* =======================================
        FIFO ALLOCATION ENGINE
======================================= */
const allocateStock = async (packages, productUnits) => {

    let remaining = productUnits;
    let totalCost = 0;
    let allocations = [];

    for (let pkg of packages) {

        if (remaining <= 0) break;
        if (pkg.remainingUnits <= 0) continue;

        const take = Math.min(pkg.remainingUnits, remaining);
        const unitCost = pkg.BP / pkg.units;

        totalCost += take * unitCost;

        allocations.push({
            packageId: pkg._id,
            parentId: pkg.parentId,
            unitsTaken: take
        });

        await Product.updateOne(
            { _id: pkg.parentId, "packages._id": pkg._id },
            { $inc: { "packages.$.remainingUnits": -take } }
        );

        remaining -= take;
    }

    if (remaining > 0) {
        throw new Error("Not enough stock in category packages");
    }

    return { totalCost, allocations };
};


/* =======================================
        CREATE PRODUCT
======================================= */
exports.createProduct = async (data, file) => {

    const cost = Number(data.cost) || 0;
    const depositPercentage = Number(data.depositPercentage) || 0;
    const itemsAvailable = Number(data.itemsAvailable) || 0;
    const productUnits = Number(data.productUnits) || 0;

    const packages = await getStockPackages(data.category, data.majorCategory);

    const { totalCost, allocations } = await allocateStock(packages, productUnits);

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


/* =======================================
        UPDATE PRODUCT
======================================= */
exports.updateProduct = async (id, data, file) => {

    const existing = await Product.findOne({ id });

    if (!existing) throw new Error("Product not found");

    const cost = Number(data.cost) || 0;
    const depositPercentage = Number(data.depositPercentage) || 0;
    const itemsAvailable = Number(data.itemsAvailable) || 0;
    const productUnits = Number(data.productUnits) || 0;

    /* restore old stock */
    if (existing.allocations?.length) {
        for (let alloc of existing.allocations) {
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

    const packages = await getStockPackages(data.category, data.majorCategory);

    const { totalCost, allocations } = await allocateStock(packages, productUnits);

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
        allocations,
        description: data.description
    };

    if (file) {
        updateData.image = "/uploads/" + file.filename;
    }

    await Product.findOneAndUpdate({ id }, updateData, { new: true });
};


/* =======================================
        DELETE PRODUCT
======================================= */
exports.deleteProduct = async (id) => {

    const product = await Product.findOne({ id });

    if (product?.allocations?.length) {
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


/* =======================================
        CATEGORY GROUPING (ADMIN)
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


/* =======================================
        DASHBOARD
======================================= */
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
        status: { $in: ["paid", "paid(cash)"] },
        orderedAt: { $gte: monthStart, $lte: monthEnd }
    });

    const yearlyOrders = await Order.find({
        status: { $in: ["paid", "paid(cash)"] },
        orderedAt: { $gte: yearStart, $lte: yearEnd }
    });

    const computeRevenue = (orders) => {

        let revenue = 0;

        orders.forEach(order => {
            order.items.forEach(item => {
                const cost = Number(item.cost) || 0;
                const qty = Number(item.quantity) || 0;
                revenue += cost * qty;
            });
        });

        return revenue;
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