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

        // attach latest stock (important for safety)
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
    paymentType
) => {

    // 🔥 STEP 1: Validate stock FIRST (critical)
    await validateStock(cart);

    // 🔥 STEP 2: Calculate totals
    const totals = exports.calculateTotals(cart);

    // 🔥 STEP 3: Create order
    const order = await Order.create({
        userId: user._id,
        items: cart,
        totalAmount: totals.total,
        depositAmount: totals.deposit,
        arrearAmount: totals.arrear,
        status: paymentType
    });

    // 🔥 STEP 4: Deduct stock AFTER order creation
    await deductStock(cart);

    // 🔥 STEP 5: Payment routing logic
    if (
        paymentType === "paid" ||
        paymentType === "depositPaid" ||
        paymentType === "arrearAmount"
    ) {
        return {
            redirectUrl: `/payment-page/${order._id}?type=${paymentType}`
        };
    }

    // pay later
    return {
        redirectUrl: "/client?success=1"
    };
};