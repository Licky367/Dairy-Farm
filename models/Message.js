const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema({
  conversationId: { type: mongoose.Schema.Types.ObjectId, ref: "Conversation", required: true },
  senderId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },

  receiverId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },

  subject: String, // email only
  message: String,

  attachment: String,

  status: {
    type: String,
    enum: ["sent", "delivered", "read"],
    default: "sent"
  },

  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Message", messageSchema);