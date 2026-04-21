const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true
    },

    // 👤 CUSTOMER SNAPSHOT (from checkoutService)
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

        depositAmount: {
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

    // 📍 DELIVERY LOCATION SYSTEM (NEW)
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

module.exports = mongoose.model("Order", orderSchema);