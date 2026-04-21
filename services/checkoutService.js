const Order = require("../models/Order");
const Product = require("../models/Product");

/**
 * Validate & normalize Google Maps URL
 */
function normalizeGoogleMaps(url) {
    if (!url) return { valid: false };

    try {
        const parsed = new URL(url);

        const allowedHosts = [
            "google.com",
            "www.google.com",
            "maps.google.com",
            "goo.gl",
            "maps.app.goo.gl"
        ];

        const isValidHost = allowedHosts.some(host =>
            parsed.hostname.includes(host)
        );

        if (!isValidHost) {
            return { valid: false };
        }

        let lat = null;
        let lng = null;

        const match = url.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
        if (match) {
            lat = parseFloat(match[1]);
            lng = parseFloat(match[2]);
        }

        return {
            valid: true,
            normalizedUrl: url.trim(),
            lat,
            lng
        };

    } catch (err) {
        return { valid: false };
    }
}

/**
 * Calculate totals
 */
exports.calculateTotals = (cart) => {
    let total = 0;
    let deposit = 0;

    cart.forEach(item => {
        total += item.cost * item.quantity;

        // ✅ FIXED: use depositAmount (NOT depositAmountPaid)
        deposit += item.depositAmount * item.quantity;
    });

    return {
        total,
        deposit,
        arrear: total - deposit
    };
};

/**
 * Validate stock
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
    }
}

/**
 * Deduct stock
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
 * MAIN ORDER FLOW
 */
exports.createOrderAndHandlePayment = async (
    cart,
    user,
    paymentType,
    deliveryData = {}
) => {

    await validateStock(cart);

    const totals = exports.calculateTotals(cart);

    // 📍 VALIDATE GOOGLE MAPS
    const locationCheck = normalizeGoogleMaps(deliveryData.locationUrl);

    if (deliveryData.locationUrl && !locationCheck.valid) {
        throw new Error("Invalid Google Maps location URL");
    }

    const order = await Order.create({
        userId: user._id,

        // 👤 customer snapshot
        customerName: user.name,
        customerEmail: user.email,
        customerPhone: user.phone,

        items: cart,

        totalAmount: totals.total,
        depositAmount: totals.deposit,

        // ❌ DO NOT set arrearAmount manually anymore
        // it will be auto-calculated in schema
        // arrearAmount: totals.arrear,

        status: paymentType,

        deliveryAddress: deliveryData.address || null,

        locationUrl: locationCheck.valid ? locationCheck.normalizedUrl : null,

        locationLat: locationCheck.lat || null,
        locationLng: locationCheck.lng || null,

        locationText: deliveryData.locationText || null
    });

    await deductStock(cart);

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