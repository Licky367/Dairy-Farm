const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },

    image: {
      type: String,
      default: ""
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
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("Product", productSchema);