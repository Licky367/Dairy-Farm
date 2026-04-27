const notificationSchema = new mongoose.Schema({
  channel: String,
  message: String,
  recipients: [String],
  status: String,
  sentBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }
}, { timestamps: true });