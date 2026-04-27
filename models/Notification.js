const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    channel: {
      type: String,
      enum: ["email", "sms", "whatsapp"],
      required: true
    },

    message: {
      type: String,
      required: true
    },

    recipients: [
      {
        type: String
      }
    ],

    status: {
      type: String,
      enum: ["pending", "sent", "failed"],
      default: "pending"
    },

    error: {
      type: String,
      default: ""
    },

    sentBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("Notification", notificationSchema);