const mongoose = require("mongoose");

const clientSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },

    productName: {
      type: String,
      required: true,
      trim: true
    },

    cost: {
      type: Number,
      required: true,
      min: 0
    },

    description: {
      type: String,
      required: true,
      trim: true
    },

    clientName: {
      type: String,
      required: true,
      trim: true
    },

    status: {
      type: String,
      enum: ["paid", "depositPaid", "payAfter"],
      required: true,
      default: "payAfter"
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("Client", clientSchema);