const Product = require("../models/Product");
const Order = require("../models/Order");
const User = require("../models/User");

/* ================= PRODUCT LOGIC ================= */

exports.getProducts = async () => {
    return await Product.find().sort({ createdAt: -1 });
};

exports.getProduct = async (id) => {
    return await Product.findOne({ id });
};

/**
 * CREATE PRODUCT (FIFO ALLOCATION)
 */
exports.createProduct = async (data, file) => {

    const cost = Number(data.cost) || 0;
    const depositPercentage = Number(data.depositPercentage) || 0;
    const itemsAvailable = Number(data.itemsAvailable) || 0;
    const productUnits = Number(data.productUnits) || 0;

    /* 🔥 VALIDATION (ADDED) */
    const productsForCategory = await Product.find({ category: data.category });

    let currentUnits = 0;

    productsForCategory.forEach(p => {
        if (p.packages && p.packages.length) {
            p.packages.forEach(pkg => {
                currentUnits += pkg.remainingUnits || 0;
            });
        }
    });

    const totalUnits = itemsAvailable * productUnits;

    if (totalUnits > currentUnits) {
        throw new Error("Total units (itemsAvailable × productUnits) cannot exceed current units");
    }

    /* 🔥 FETCH CATEGORY PRODUCTS (SOURCE OF PACKAGES) */
    const products = await Product.find({ category: data.category });

    if (!products.length) {
        throw new Error("Category does not exist");
    }

    /* 🔥 COLLECT ALL PACKAGES */
    let packages = [];

    products.forEach(p => {
        if (p.packages && p.packages.length) {
            p.packages.forEach(pkg => {
                packages.push({
                    ...pkg.toObject(),
                    parentId: p._id
                });
            });
        }
    });

    /* 🔥 SORT FIFO (oldest first) */
    packages.sort(
        (a, b) => new Date(a._id.getTimestamp()) - new Date(b._id.getTimestamp())
    );

    let remainingNeeded = productUnits;
    let totalCost = 0;

    /* 🔥 FIFO ALLOCATION */
    for (let pkg of packages) {

        if (remainingNeeded <= 0) break;
        if (pkg.remainingUnits <= 0) continue;

        const takeUnits = Math.min(pkg.remainingUnits, remainingNeeded);

        const unitCost = pkg.BP / pkg.units;

        totalCost += takeUnits * unitCost;

        /* 🔥 DEDUCT FROM DB */
        await Product.updateOne(
            {
                _id: pkg.parentId,
                "packages._id": pkg._id
            },
            {
                $inc: {
                    "packages.$.remainingUnits": -takeUnits
                }
            }
        );

        remainingNeeded -= takeUnits;
    }

    if (remainingNeeded > 0) {
        throw new Error("Not enough stock in category packages");
    }

    const purchasePrice = totalCost;

    /* ✅ CREATE PRODUCT */
    await Product.create({
        id: data.id,
        name: data.name,
        category: data.category,
        image: file ? "/uploads/" + file.filename : "",
        cost: cost,
        purchasePrice: purchasePrice,
        depositPercentage: depositPercentage,
        depositAmount: (cost * depositPercentage) / 100,
        itemsAvailable: itemsAvailable,
        productUnits: productUnits,
        description: data.description
    });
};

/**
 * UPDATE PRODUCT (UNCHANGED — but ignores purchasePrice changes)
 */
exports.updateProduct = async (id, data, file) => {

    const cost = Number(data.cost) || 0;
    const depositPercentage = Number(data.depositPercentage) || 0;
    const itemsAvailable = Number(data.itemsAvailable) || 0;
    const productUnits = Number(data.productUnits) || 0;

    /* 🔥 VALIDATION (ADDED) */
    const productsForCategory = await Product.find({ category: data.category });

    let currentUnits = 0;

    productsForCategory.forEach(p => {
        if (p.packages && p.packages.length) {
            p.packages.forEach(pkg => {
                currentUnits += pkg.remainingUnits || 0;
            });
        }
    });

    const totalUnits = itemsAvailable * productUnits;

    if (totalUnits > currentUnits) {
        throw new Error("Total units (itemsAvailable × productUnits) cannot exceed current units");
    }

    const updateData = {
        name: data.name,
        category: data.category,
        cost: cost,
        depositPercentage: depositPercentage,
        depositAmount: (cost * depositPercentage) / 100,
        itemsAvailable: itemsAvailable,
        productUnits: productUnits,
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

exports.deleteProduct = async (id) => {
    await Product.findOneAndDelete({ id });
};

/* ================= CATEGORY LOGIC ================= */

exports.getCategories = async () => {

    const data = await Product.aggregate([
        {
            $group: {
                _id: "$category",

                /* marketed units */
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

        const allPackages = (cat.packages || []).flat();

        const totalUnits = allPackages.reduce(
            (sum, p) => sum + (p.units || 0), 0
        );

        const remainingUnits = allPackages.reduce(
            (sum, p) => sum + (p.remainingUnits || 0), 0
        );

        return {
            category: cat._id,
            stockedUnits,
            currentUnits: remainingUnits,
            totalUnits
        };
    });
};

/* ================= DASHBOARD LOGIC (UNCHANGED) ================= */

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