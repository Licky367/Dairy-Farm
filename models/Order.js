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
        image: String
      }
    ],

    totalAmount: {
      type: Number,
      required: true
    },

    status: {
      type: String,
      enum: ["paid", "depositPaid", "payAfter"],
      default: "payAfter"
    },

    // Manual payment tracking (cash)
    manualPayment: {
      adminId: String,
      adminName: String,
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