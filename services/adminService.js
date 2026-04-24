const Product = require("../models/Product");
const Order = require("../models/Order");
const User = require("../models/User");

/* ================= PRODUCT LOGIC (UNCHANGED) ================= */

exports.getProducts = async () => {
    return await Product.find().sort({ createdAt: -1 });
};

exports.getProduct = async (id) => {
    return await Product.findOne({ id });
};

exports.createProduct = async (data, file) => {
    const cost = Number(data.cost) || 0;
    const depositPercentage =
        Number(data.depositPercentage) || 0;
    const itemsAvailable =
        Number(data.itemsAvailable) || 0;

    const purchasePrice =
        Number(data.purchasePrice) || 0;

    await Product.create({
        id: data.id,
        name: data.name,
        category: data.category,
        image: file ? "/uploads/" + file.filename : "",
        cost: cost,
        purchasePrice: purchasePrice,
        depositPercentage: depositPercentage,
        depositAmount:
            (cost * depositPercentage) / 100,
        itemsAvailable: itemsAvailable,
        description: data.description
    });
};

exports.updateProduct = async (id, data, file) => {
    const cost = Number(data.cost) || 0;
    const depositPercentage =
        Number(data.depositPercentage) || 0;
    const itemsAvailable =
        Number(data.itemsAvailable) || 0;

    const purchasePrice =
        Number(data.purchasePrice) || 0;

    const updateData = {
        name: data.name,
        category: data.category,
        cost: cost,
        purchasePrice: purchasePrice,
        depositPercentage: depositPercentage,
        depositAmount:
            (cost * depositPercentage) / 100,
        itemsAvailable: itemsAvailable,
        description: data.description
    };

    if (file) {
        updateData.image =
            "/uploads/" + file.filename;
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

/* ================= DASHBOARD LOGIC (ADDED ONLY) ================= */

exports.getDashboardData = async ({ month, year }) => {

    const now = new Date();

    const selectedYear = Number(year) || now.getFullYear();
    const selectedMonth = Number(month) || (now.getMonth() + 1);

    const monthStart = new Date(selectedYear, selectedMonth - 1, 1);
    const monthEnd = new Date(selectedYear, selectedMonth, 0, 23, 59, 59);

    const yearStart = new Date(selectedYear, 0, 1);
    const yearEnd = new Date(selectedYear, 11, 31, 23, 59, 59);

    /* ===== ORDERS ===== */

    const totalOrders = await Order.countDocuments({
        orderedAt: { $gte: monthStart, $lte: monthEnd }
    });

    const yearOrders = await Order.countDocuments({
        orderedAt: { $gte: yearStart, $lte: yearEnd }
    });

    /* ===== REVENUE (DELIVERED ONLY) ===== */

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

    /* ===== CLIENTS ===== */

    const totalClients = await User.countDocuments({
        role: "client"
    });

    /* ===== PRODUCTS ===== */

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

    /* ===== RECENT ORDERS ===== */

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
};const Product = require("../models/Product");
const Order = require("../models/Order");
const User = require("../models/User");

/* ================= PRODUCT LOGIC (UNCHANGED) ================= */

exports.getProducts = async () => {
    return await Product.find().sort({ createdAt: -1 });
};

exports.getProduct = async (id) => {
    return await Product.findOne({ id });
};

exports.createProduct = async (data, file) => {
    const cost = Number(data.cost) || 0;
    const depositPercentage =
        Number(data.depositPercentage) || 0;
    const itemsAvailable =
        Number(data.itemsAvailable) || 0;

    const purchasePrice =
        Number(data.purchasePrice) || 0;

    await Product.create({
        id: data.id,
        name: data.name,
        category: data.category,
        image: file ? "/uploads/" + file.filename : "",
        cost: cost,
        purchasePrice: purchasePrice,
        depositPercentage: depositPercentage,
        depositAmount:
            (cost * depositPercentage) / 100,
        itemsAvailable: itemsAvailable,
        description: data.description
    });
};

exports.updateProduct = async (id, data, file) => {
    const cost = Number(data.cost) || 0;
    const depositPercentage =
        Number(data.depositPercentage) || 0;
    const itemsAvailable =
        Number(data.itemsAvailable) || 0;

    const purchasePrice =
        Number(data.purchasePrice) || 0;

    const updateData = {
        name: data.name,
        category: data.category,
        cost: cost,
        purchasePrice: purchasePrice,
        depositPercentage: depositPercentage,
        depositAmount:
            (cost * depositPercentage) / 100,
        itemsAvailable: itemsAvailable,
        description: data.description
    };

    if (file) {
        updateData.image =
            "/uploads/" + file.filename;
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

/* ================= CATEGORY LOGIC (NEW - SAFE ADDITION) ================= */

exports.getCategories = async () => {

    const categories = await Product.aggregate([
        {
            $group: {
                _id: "$category",

                stockedUnits: {
                    $sum: {
                        $multiply: [
                            "$productUnits",
                            "$itemsAvailable"
                        ]
                    }
                },

                BP: { $last: "$BP" },
                packageUnits: { $last: "$packageUnits" }
            }
        },
        {
            $project: {
                _id: 0,
                category: "$_id",
                stockedUnits: 1,
                BP: 1,
                packageUnits: 1
            }
        }
    ]);

    return categories;
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

    /* ===== ORDERS ===== */

    const totalOrders = await Order.countDocuments({
        orderedAt: { $gte: monthStart, $lte: monthEnd }
    });

    const yearOrders = await Order.countDocuments({
        orderedAt: { $gte: yearStart, $lte: yearEnd }
    });

    /* ===== REVENUE (DELIVERED ONLY) ===== */

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

    /* ===== CLIENTS ===== */

    const totalClients = await User.countDocuments({
        role: "client"
    });

    /* ===== PRODUCTS ===== */

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

    /* ===== RECENT ORDERS ===== */

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