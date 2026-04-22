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

/* =========================================================
   MAIN CHECKOUT FLOW (UPDATED WITH DELIVERY DATE + GPS)
========================================================= */

exports.createOrderAndHandlePayment = async (
    cart,
    user,
    paymentType,
    deliveryData = {}
) => {

    await validateStock(cart);

    const totals = exports.calculateTotals(cart);

    /* ================= LOCATION HANDLING ================= */

    const locationCheck = normalizeGoogleMaps(deliveryData.locationUrl);

    if (deliveryData.locationUrl && !locationCheck.valid) {
        throw new Error("Invalid Google Maps location URL");
    }

    /**
     * ============================================
     * PAY AFTER → immediate order creation
     * ============================================
     */
    if (paymentType === "payAfter") {

        const order = await Order.create({
            userId: user._id,

            customerName: user.name,
            customerEmail: user.email,
            customerPhone: user.phone,

            items: cart,

            totalAmount: totals.total,
            depositAmount: totals.deposit,

            status: paymentType,

            /* ================= DELIVERY DATA ================= */
            deliveryAddress: deliveryData.address || null,
            locationUrl: locationCheck.valid ? locationCheck.normalizedUrl : null,
            locationLat: deliveryData.locationLat || locationCheck.lat || null,
            locationLng: deliveryData.locationLng || locationCheck.lng || null,
            locationText: deliveryData.locationText || null,

            /* ================= NEW: DELIVERY DATE ================= */
            expectedDeliveryDate: deliveryData.expectedDeliveryDate || null
        });

        await deductStock(cart);

        return {
            redirectUrl: "/client?success=1"
        };
    }

    /**
     * ============================================
     * PAID / DEPOSIT / ARREAR → wait for payment
     * ============================================
     */
    if (
        paymentType === "paid" ||
        paymentType === "depositPaid" ||
        paymentType === "arrearAmount"
    ) {

        return {
            redirectUrl: `/payment-page?type=${paymentType}`,
            checkoutData: {
                cart,
                user,
                totals,
                paymentType,

                /* ================= DELIVERY DATA ================= */
                deliveryData: {
                    address: deliveryData.address || null,
                    locationUrl: locationCheck.valid ? locationCheck.normalizedUrl : null,
                    locationLat: deliveryData.locationLat || locationCheck.lat || null,
                    locationLng: deliveryData.locationLng || locationCheck.lng || null,
                    locationText: deliveryData.locationText || null,

                    /* ================= NEW FIELD ================= */
                    expectedDeliveryDate: deliveryData.expectedDeliveryDate || null
                }
            }
        };
    }

    throw new Error("Invalid payment type");
};

/* =========================================================
   CREATE ORDER AFTER PAYMENT SUCCESS
========================================================= */

exports.createOrderAfterPayment = async (checkoutData) => {

    if (!checkoutData) {
        throw new Error("Missing checkout data");
    }

    await validateStock(checkoutData.cart);

    const order = await Order.create({
        userId: checkoutData.user._id,

        customerName: checkoutData.user.name,
        customerEmail: checkoutData.user.email,
        customerPhone: checkoutData.user.phone,

        items: checkoutData.cart,

        totalAmount: checkoutData.totals.total,
        depositAmount: checkoutData.totals.deposit,

        status: checkoutData.paymentType,

        /* ================= DELIVERY DATA ================= */
        deliveryAddress: checkoutData.deliveryData.address || null,
        locationUrl: checkoutData.deliveryData.locationUrl || null,
        locationLat: checkoutData.deliveryData.locationLat || null,
        locationLng: checkoutData.deliveryData.locationLng || null,
        locationText: checkoutData.deliveryData.locationText || null,

        /* ================= NEW: DELIVERY DATE ================= */
        expectedDeliveryDate: checkoutData.deliveryData.expectedDeliveryDate || null
    });

    await deductStock(checkoutData.cart);

    return order;
};