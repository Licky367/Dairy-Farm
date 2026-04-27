const User = require("../models/User");
const Notification = require("../models/Notification");

const {
  sendEmailBulk,
  sendSMSBulk,
  sendWhatsAppBulk
} = require("./providers"); // we’ll create this next

exports.processNotification = async ({
  channel,
  message,
  userIds,
  sendToAll,
  manualEmails = [],
  manualPhones = [],
  senderId
}) => {
  try {
    let users = [];

    if (sendToAll) {
      users = await User.find();
    } else if (userIds && userIds.length > 0) {
      users = await User.find({ _id: { $in: userIds } });
    }

    const emails = users.map(u => u.email);
    const phones = users.map(u => u.phone);

    // merge manual inputs
    const finalEmails = [...new Set([...emails, ...manualEmails])];
    const finalPhones = [...new Set([...phones, ...manualPhones])];

    let recipientsUsed = [];

    if (channel === "email") {
      await sendEmailBulk(finalEmails, message);
      recipientsUsed = finalEmails;
    }

    if (channel === "sms") {
      await sendSMSBulk(finalPhones, message);
      recipientsUsed = finalPhones;
    }

    if (channel === "whatsapp") {
      await sendWhatsAppBulk(finalPhones, message);
      recipientsUsed = finalPhones;
    }


if (!message || message.length < 1) {
  throw new Error("Message cannot be empty");
}

if (!["email", "sms", "whatsapp"].includes(channel)) {
  throw new Error("Invalid channel");
}


    await Notification.create({
      channel,
      message,
      recipients: recipientsUsed,
      status: "sent",
      sentBy: senderId
    });

    return { success: true };

  } catch (error) {
    await Notification.create({
      channel,
      message,
      recipients: [],
      status: "failed",
      error: error.message,
      sentBy: senderId
    });

    throw error;
  }
};