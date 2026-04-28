const User = require("../models/User");
const Notification = require("../models/Notification");

const {
  sendEmailBulk,
  sendSMSBulk,
  sendWhatsAppBulk
} = require("./providers");


/* ===============================
   PROCESS NOTIFICATION
================================= */
exports.processNotification = async ({
  channel,
  message,
  userIds,
  sendToAll,
  manualEmails = [],
  manualPhones = [],
  senderId,
  attachment = null
}) => {
  try {
    /* ===============================
       VALIDATION
    =============================== */
    if (!message || message.trim().length < 1) {
      throw new Error("Message cannot be empty");
    }

    if (!["email", "sms", "whatsapp"].includes(channel)) {
      throw new Error("Invalid channel");
    }

    /* ===============================
       GET USERS
    =============================== */
    let users = [];

    if (sendToAll) {
      users = await User.find();
    } else if (userIds && userIds.length > 0) {
      users = await User.find({ _id: { $in: userIds } });
    }

    /* ===============================
       EXTRACT CONTACTS
    =============================== */
    const emails = users.map(u => u.email).filter(Boolean);
    const phones = users.map(u => u.phone).filter(Boolean);

    const finalEmails = [...new Set([...emails, ...manualEmails])];
    const finalPhones = [...new Set([...phones, ...manualPhones])];

    let recipientsUsed = [];

    /* ===============================
       SEND VIA PROVIDERS
       (providers handle sender identity)
    =============================== */
    if (channel === "email") {
      await sendEmailBulk(finalEmails, message, attachment);
      recipientsUsed = finalEmails;
    }

    if (channel === "sms") {
      await sendSMSBulk(finalPhones, message);
      recipientsUsed = finalPhones;
    }

    if (channel === "whatsapp") {
      await sendWhatsAppBulk(finalPhones, message, attachment);
      recipientsUsed = finalPhones;
    }

    /* ===============================
       STORE PER RECIPIENT
       (conversation-ready)
    =============================== */
    const notifications = [];

    // Users (linked to system users)
    users.forEach(user => {
      notifications.push({
        channel,
        message,
        receiverId: user._id,
        recipient: channel === "email" ? user.email : user.phone,
        senderId,
        attachment: attachment ? attachment.path || attachment.filename : null,
        status: "sent"
      });
    });

    // Manual recipients (not in DB)
    recipientsUsed.forEach(recipient => {
      const existsInUsers = users.find(u =>
        u.email === recipient || u.phone === recipient
      );

      if (!existsInUsers) {
        notifications.push({
          channel,
          message,
          recipient,
          senderId,
          attachment: attachment ? attachment.path || attachment.filename : null,
          status: "sent"
        });
      }
    });

    await Notification.insertMany(notifications);

    return { success: true };

  } catch (error) {
    /* ===============================
       FAILURE LOG
    =============================== */
    await Notification.create({
      channel,
      message,
      status: "failed",
      error: error.message,
      senderId
    });

    throw error;
  }
};