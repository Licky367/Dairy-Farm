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

            // TOTAL PRICE PER BUNDLE
            cost: {
                type: Number,
                required: true
            },

            // UNITS INSIDE A BUNDLE
            productUnits: {
                type: Number,
                required: true,
                min: 1
            },

            // NUMBER OF BUNDLES
            quantity: {
                type: Number,
                required: true,
                min: 1
            },

            image: String,

            // PURCHASE COST PER BUNDLE
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

    // 🚚 COSTS
    shippingCost: {
        type: Number,
        default: 0
    },

    transportationCost: {
        type: Number,
        default: 0
    },

    // 💰 ORDER TOTALS
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

    // 📊 FINANCIAL METRICS
    totalRevenue: {
        type: Number,
        default: 0
    },

    totalCost: {
        type: Number,
        default: 0
    },

    profit: {
        type: Number,
        default: 0
    },

    netProfit: {
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

    // ARREARS
    doc.arrearAmount = Math.max(0, total - paidDeposit);

    const isRevenueOrder = ["paid", "paid(cash)"].includes(doc.status);

    if (!isRevenueOrder) {
        doc.totalRevenue = 0;
        doc.totalCost = 0;
        doc.profit = 0;
        doc.netProfit = 0;
        return;
    }

    let revenue = 0;
    let cost = 0;

    (doc.items || []).forEach(item => {
        const bundlePrice = Number(item.cost || 0);
        const purchasePrice = Number(item.purchasePrice || 0);
        const qty = Number(item.quantity || 0);

        revenue += bundlePrice * qty;
        cost += purchasePrice * qty;
    });

    const transportation = Number(doc.transportationCost || 0);

    doc.totalRevenue = revenue;
    doc.totalCost = cost;
    doc.profit = revenue - cost;
    doc.netProfit = doc.profit - transportation;
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

    const hasRelevantUpdate =
        update.items ||
        (update.$set && (
            update.$set.items ||
            update.$set.transportationCost ||
            update.$set.status ||
            update.$set.depositAmountPaid ||
            update.$set.totalAmount
        ));

    if (!hasRelevantUpdate) return next();

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
            profit: merged.profit,
            netProfit: merged.netProfit,
            arrearAmount: merged.arrearAmount
        }
    });

    next();
});

module.exports = mongoose.model("Order", orderSchema);