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
        quantity: Number
      }
    ],

    status: {
      type: String,
      enum: ["paid", "depositPaid", "payAfter"],
      default: "payAfter"
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("Order", orderSchema);