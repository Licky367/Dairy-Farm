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
cost: Number,
quantity: Number,
image: String,

purchasePrice: {
type: Number,
default: 0
},

shippingCost: {
type: Number,
default: 0
},

depositAmount: {
type: Number,
default: 0
},

revenue: {
type: Number,
default: 0
}
}
],

// 💰 FINANCIALS
totalAmount: {
type: Number,
required: true
},

depositAmount: {
type: Number,
default: 0
},

// ✅ TRACK ACTUAL PAID DEPOSIT
depositAmountPaid: {
type: Number,
default: 0
},

// ✅ AUTO-CALCULATED FIELD
arrearAmount: {
type: Number,
default: 0
},

totalRevenue: {
type: Number,
default: 0
},

// 🕒 ORDER TIME
orderedAt: {
type: Date,
default: Date.now
},

// 💳 PAYMENT STATUS
status: {
type: String,
enum: ["paid", "depositPaid", "payAfter", "paid(cash)"],
default: "payAfter"
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

deliveredAt: {
type: Date
},

// 📍 LOCATION
deliveryAddress: String,
locationUrl: String,
locationLat: Number,
locationLng: Number,
locationText: String
},
{
timestamps: true
}
);

/* ========================= */
/* CALCULATIONS */
/* ========================= */

function calculateFinancials(doc) {

// ✅ ARREARS AUTO-CALCULATION
const total = Number(doc.totalAmount || 0);
const paidDeposit = Number(doc.depositAmountPaid || 0);

doc.arrearAmount = Math.max(0, total - paidDeposit);

// ✅ REVENUE CALCULATION (ONLY IF DELIVERED)
if (!doc.delivered) {
doc.totalRevenue = 0;
return;
}

let totalRevenue = 0;

doc.items.forEach(item => {
const cost = Number(item.cost || 0);
const purchasePrice = Number(item.purchasePrice || 0);
const shippingCost = Number(item.shippingCost || 0);
const qty = Number(item.quantity || 1);

const itemRevenue =
(cost - (purchasePrice + shippingCost)) * qty;

item.revenue = itemRevenue;
totalRevenue += itemRevenue;
});

doc.totalRevenue = totalRevenue;
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

// run calculation
calculateFinancials(doc);

// push back update safely
if (update.$set) {
update.$set = doc;
} else {
update = doc;
}

this.setUpdate(update);

next();
});

module.exports = mongoose.model("Order", orderSchema);