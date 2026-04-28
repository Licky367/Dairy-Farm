const User = require("../models/User");
const Conversation = require("../models/Conversation");
const Message = require("../models/Message");

const {
  sendEmailBulk,
  sendSMSBulk,
  sendWhatsAppBulk
} = require("./providers");


/* ===============================
   GET OR CREATE CONVERSATION
================================= */
const getConversation = async (userId, channel) => {
  let convo = await Conversation.findOne({ userId, channel });

  if (!convo) {
    convo = await Conversation.create({ userId, channel });
  }

  return convo;
};


/* ===============================
   PROCESS NOTIFICATION (NEW SYSTEM)
================================= */
exports.processNotification = async ({
  channel,
  subject = "",
  message,
  userIds,
  sendToAll,
  manualEmails = [],
  manualPhones = [],
  senderId,
  attachment = null
}) => {

  if (!message || !message.trim()) {
    throw new Error("Message cannot be empty");
  }

  if (!["email", "sms", "whatsapp"].includes(channel)) {
    throw new Error("Invalid channel");
  }

  if (channel === "email" && !subject) {
    throw new Error("Email subject is required");
  }

  /* ===============================
     USERS
  =============================== */
  let users = [];

  if (sendToAll) {
    users = await User.find();
  } else if (userIds?.length) {
    users = await User.find({ _id: { $in: userIds } });
  }

  const emails = users.map(u => u.email).filter(Boolean);
  const phones = users.map(u => u.phone).filter(Boolean);

  const finalEmails = [...new Set([...emails, ...manualEmails])];
  const finalPhones = [...new Set([...phones, ...manualPhones])];


  /* ===============================
     SEND VIA PROVIDERS
  =============================== */
  if (channel === "email") {
    await sendEmailBulk(finalEmails, subject, message, attachment);
  }

  if (channel === "sms") {
    await sendSMSBulk(finalPhones, message);
  }

  if (channel === "whatsapp") {
    await sendWhatsAppBulk(finalPhones, message, attachment);
  }


  /* ===============================
     STORE MESSAGES (THREAD SYSTEM)
  =============================== */
  for (const user of users) {

    const conversation = await getConversation(user._id, channel);

    const msg = await Message.create({
      conversationId: conversation._id,
      senderId,
      receiverId: user._id,
      subject: channel === "email" ? subject : null,
      message,
      attachment: attachment ? attachment.path || attachment.filename : null,
      status: "sent"
    });

    conversation.lastMessage = message;
    conversation.lastUpdated = new Date();
    await conversation.save();
  }

  return { success: true };
};