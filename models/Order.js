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

// NEW: required for revenue calculation
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

// computed per item
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

arrearAmount: {
type: Number,
default: 0
},

// 🧾 TOTAL ORDER REVENUE (NEW)
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

// 🧾 CASH PAYMENT TRACKING
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

deliveredAt: {
type: Date
},

// 📍 DELIVERY LOCATION
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
/* REVENUE CALCULATION LOGIC */
/* ========================= */

function calculateOrderRevenue(doc) {
if (!doc.delivered) {
doc.totalRevenue = 0;
return;
}

let total = 0;

doc.items.forEach(item => {
const cost = Number(item.cost || 0);
const purchasePrice = Number(item.purchasePrice || 0);
const shippingCost = Number(item.shippingCost || 0);
const qty = Number(item.quantity || 1);

// revenue per item
const itemRevenue =
(cost - (purchasePrice + shippingCost)) * qty;

item.revenue = itemRevenue;
total += itemRevenue;
});

doc.totalRevenue = total;
}

/* BEFORE SAVE */
orderSchema.pre("save", function (next) {
calculateOrderRevenue(this);
next();
});

/* BEFORE UPDATE */
orderSchema.pre("findOneAndUpdate", function (next) {
const update = this.getUpdate() || {};

/*
If items or delivered is updated, we recalculate.
For safety, we rely on full doc recalculation pattern.
*/

if (update.delivered !== undefined || update.items !== undefined) {
const doc = update.$set || update;
calculateOrderRevenue(doc);
this.setUpdate(update);
}

next();
});

module.exports = mongoose.model("Order", orderSchema);