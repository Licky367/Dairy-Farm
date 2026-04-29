const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
{
    userId: {
        type: String,
        required: true,
        index: true
    },

    // 👤 CUSTOMER SNAPSHOT
    customerName: String,
    customerEmail: String,
    customerPhone: String,

    // 📦 ITEMS (BUNDLES)
    items: [
        {
            id: String,
            name: String,

            // 🔥 TOTAL PRODUCT PRICE (NOT UNIT PRICE)
            cost: {
                type: Number,
                required: true
            },

            // 🔥 NUMBER OF UNITS INSIDE THIS PRODUCT
            productUnits: {
                type: Number,
                required: true,
                min: 1
            },

            // 🔥 NUMBER OF BUNDLES BOUGHT
            quantity: {
                type: Number,
                required: true,
                min: 1
            },

            image: String,

            purchasePrice: {
                type: Number,
                default: 0
            },

            depositAmount: {
                type: Number,
                default: 0
            }
        }
    ],

    // 🚚 SHIPPING
    shippingCost: {
        type: Number,
        default: 0
    },

    // 🚚 TRANSPORTATION
    transportationCost: {
        type: Number,
        default: 0
    },

    // 💰 FINANCIALS
    totalAmount: {
        type: Number,
        required: true
    },

    depositAmount: {
        type: Number,
        default: 0
    },

    depositAmountPaid: {
        type: Number,
        default: 0
    },

    arrearAmount: {
        type: Number,
        default: 0
    },

    totalRevenue: {
        type: Number,
        default: 0
    },

    totalCost: {
        type: Number,
        default: 0
    },

    totalProfit: {
        type: Number,
        default: 0
    },

    // 🕒 ORDER TIME
    orderedAt: {
        type: Date,
        default: Date.now,
        index: true
    },

    // 💳 PAYMENT STATUS
    status: {
        type: String,
        enum: ["paid", "depositPaid", "payAfter", "paid(cash)"],
        default: "payAfter",
        index: true
    },

    paymentType: {
        type: String,
        enum: ["paid", "depositPaid", "payAfter", "arrearAmount", "payArrears"],
        default: null
    },

    paymentMethod: {
        type: String,
        enum: ["M-PESA", "BANK", "CARD"],
        default: null
    },

    manualPayment: {
        adminId: String,
        adminName: String,
        amount: Number,
        method: {
            type: String,
            default: "cash"
        },
        paidAt: Date
    },

    // 🚚 DELIVERY
    delivered: {
        type: Boolean,
        default: false
    },

    deliveredBy: {
        adminId: String,
        adminName: String
    },

    deliveredAt: Date,

    // 📍 LOCATION
    deliveryAddress: String,
    locationUrl: String,
    locationLat: Number,
    locationLng: Number,
    locationText: String,

    expectedDeliveryDate: {
        type: Date,
        default: null
    }

},
{
    timestamps: true
});

/* =========================
   FINANCIAL CALCULATIONS
========================= */
function calculateFinancials(doc) {

    const total = Number(doc.totalAmount || 0);
    const paidDeposit = Number(doc.depositAmountPaid || 0);

    // arrears
    doc.arrearAmount = Math.max(0, total - paidDeposit);

    const isRevenueOrder = ["paid", "paid(cash)"].includes(doc.status);

    if (!isRevenueOrder) {
        doc.totalRevenue = 0;
        doc.totalCost = 0;
        doc.totalProfit = 0;
        return;
    }

    let revenue = 0;
    let cost = 0;

    (doc.items || []).forEach(item => {

        const bundlePrice = Number(item.cost || 0);
        const buyPrice = Number(item.purchasePrice || 0);
        const qty = Number(item.quantity || 0);

        // 🔥 REVENUE = bundle price * number of bundles 
        revenue += bundlePrice * qty;

        // 🔥 COST = purchase price * number of bundles
        cost += buyPrice * qty;
    });

    doc.totalRevenue = revenue;
    doc.totalCost = cost;

    doc.totalProfit = revenue - cost - Number(doc.transportationCost || 0);
}

/* =========================
   HOOKS
========================= */

orderSchema.pre("save", function (next) {
    calculateFinancials(this);
    next();
});

orderSchema.pre("findOneAndUpdate", async function (next) {

    const update = this.getUpdate();

    if (!update.items && !(update.$set && update.$set.items)) {
        return next();
    }

    const docToUpdate = await this.model.findOne(this.getQuery());
    if (!docToUpdate) return next();

    const merged = {
        ...docToUpdate.toObject(),
        ...(update.$set || update)
    };

    calculateFinancials(merged);

    this.setUpdate({
        ...update,
        $set: {
            ...(update.$set || {}),
            totalRevenue: merged.totalRevenue,
            totalCost: merged.totalCost,
            totalProfit: merged.totalProfit,
            arrearAmount: merged.arrearAmount
        }
    });

    next();
});

module.exports = mongoose.model("Order", orderSchema);