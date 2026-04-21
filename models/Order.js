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

        // used in service calculations
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

    // 🕒 explicit order time (recommended)
    orderedAt: {
      type: Date,
      default: Date.now
    },

    // payment status (extended)
    status: {
      type: String,
      enum: ["paid", "depositPaid", "payAfter", "paid(cash)"],
      default: "payAfter"
    },

    // manual admin payment (cash settlement)
    manualPayment: {
      adminId: String,
      adminName: String,

      /**
       * RULE:
       * - depositPaid → arrearAmount
       * - payAfter → totalAmount
       * (handled in backend)
       */
      amount: Number,

      method: {
        type: String,
        default: "cash"
      },

      paidAt: Date
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("Order", orderSchema);