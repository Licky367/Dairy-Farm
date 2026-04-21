const Order = require("../models/Order");
const Product = require("../models/Product");

/**
 * Calculate totals from cart
 */
exports.calculateTotals = (cart) => {
    let total = 0;
    let deposit = 0;

    cart.forEach(item => {
        total += item.cost * item.quantity;
        deposit += item.depositAmount * item.quantity;
    });

    return {
        total,
        deposit,
        arrear: total - deposit
    };
};

/**
 * Validate stock BEFORE order creation
 */
async function validateStock(cart) {
    for (const item of cart) {
        const product = await Product.findOne({ id: item.id });

        if (!product) {
            throw new Error(`Product ${item.name} not found`);
        }

        if (item.quantity > product.itemsAvailable) {
            throw new Error(
                `Insufficient stock for ${item.name}. Available: ${product.itemsAvailable}`
            );
        }

        item._productDoc = product;
    }
}

/**
 * Deduct stock AFTER order creation
 */
async function deductStock(cart) {
    for (const item of cart) {
        const product = await Product.findOne({ id: item.id });

        if (!product) continue;

        product.itemsAvailable =
            Math.max(0, product.itemsAvailable - item.quantity);

        await product.save();
    }
}

/**
 * MAIN ORDER CREATION FLOW
 */
exports.createOrderAndHandlePayment = async (
    cart,
    user,
    paymentType,
    deliveryData = {} // 👈 NEW: frontend location input
) => {

    // STEP 1: Validate stock
    await validateStock(cart);

    // STEP 2: Totals
    const totals = exports.calculateTotals(cart);

    // STEP 3: Create order WITH CUSTOMER + LOCATION DATA
    const order = await Order.create({
        userId: user._id,

        // 👤 CUSTOMER DETAILS (NEW)
        customerName: user.name,
        customerEmail: user.email,
        customerPhone: user.phone,

        // 📦 CART ITEMS
        items: cart,

        // 💰 FINANCIALS
        totalAmount: totals.total,
        depositAmount: totals.deposit,
        arrearAmount: totals.arrear,

        // 🕒 STATUS
        status: paymentType,

        // 📍 DELIVERY DATA (NEW)
        deliveryAddress: deliveryData.address || null,
        locationUrl: deliveryData.locationUrl || null,
        locationText: deliveryData.locationText || null
    });

    // STEP 4: Deduct stock
    await deductStock(cart);

    // STEP 5: PAYMENT ROUTING (UNCHANGED)
    if (
        paymentType === "paid" ||
        paymentType === "depositPaid" ||
        paymentType === "arrearAmount"
    ) {
        return {
            redirectUrl: `/payment-page/${order._id}?type=${paymentType}`
        };
    }

    return {
        redirectUrl: "/client?success=1"
    };
};