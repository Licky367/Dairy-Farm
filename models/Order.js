const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true
    },

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

    // financials (from service)
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

    // 🕒 order creation time
    orderedAt: {
      type: Date,
      default: Date.now
    },

    // payment status
    status: {
      type: String,
      enum: ["paid", "depositPaid", "payAfter", "paid(cash)"],
      default: "payAfter"
    },

    // 🧾 manual cash payment tracking
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

    // 🚚 DELIVERY TRACKING (NEW)
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
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("Order", orderSchema);