const mongoose = require("mongoose");

const conversationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  channel: { type: String, enum: ["email", "sms", "whatsapp"], required: true },
  lastMessage: String,
  lastUpdated: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Conversation", conversationSchema);