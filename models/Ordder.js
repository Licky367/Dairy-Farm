const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
{
    userId: {
        type: String,
        required: true
    },

    // 👤 CUSTOMER SNAPSHOT
    customerName: String,
    customerEmail: String,
    customerPhone: String,

    // 📦 ITEMS
    items: [
        {
            id: String,
            name: String,
            cost: Number, // selling price
            quantity: Number,
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

    // 🚚 ORDER LEVEL SHIPPING (IMPORTANT FIX)
    shippingCost: {
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
        default: Date.now
    },

    // =========================
    // PAYMENT STATUS
    // =========================
    status: {
        type: String,
        enum: ["paid", "depositPaid", "payAfter", "paid(cash)"],
        default: "payAfter"
    },

    paymentType: {
        type: String,
        enum: ["paid", "depositPaid", "payAfter", "arrearAmount", "payArrears"],
        default: null
    },

    // =========================
    // PAYMENT METHOD
    // =========================
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

    // 🚚 DELIVERY STATUS
    delivered: {
        type: Boolean,
        default: false
    },

    deliveredBy: {
        adminId: String,
        adminName: String
    },

    deliveredAt: Date,

    // 📍 DELIVERY INFO
    deliveryAddress: String,
    locationUrl: String,
    locationLat: Number,
    locationLng: Number,
    locationText: String,

    // 📅 DELIVERY TIMING
    expectedDeliveryDate: {
        type: Date,
        default: null
    }

},
{
    timestamps: true
}
);

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

    doc.items.forEach(item => {

        const sellPrice = Number(item.cost || 0);
        const buyPrice = Number(item.purchasePrice || 0);
        const qty = Number(item.quantity || 0);

        revenue += sellPrice * qty;
        cost += buyPrice * qty;
    });

    doc.totalRevenue = revenue;
    doc.totalCost = cost;
    doc.totalProfit = revenue - cost - (Number(doc.shippingCost || 0));
}

/* BEFORE SAVE */
orderSchema.pre("save", function (next) {
    calculateFinancials(this);
    next();
});

/* BEFORE UPDATE */
orderSchema.pre("findOneAndUpdate", function (next) {

    let update = this.getUpdate() || {};
    let doc = update.$set || update;

    calculateFinancials(doc);

    if (update.$set) {
        update.$set = doc;
    } else {
        update = doc;
    }

    this.setUpdate(update);

    next();
});

module.exports = mongoose.model("Order", orderSchema);