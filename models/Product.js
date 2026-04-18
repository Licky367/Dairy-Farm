const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },

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

    depositPercentage: {
      type: Number,
      required: true,
      min: 0,
      max: 100
    },

    depositAmount: {
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