// ================= EMAIL =================
const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

exports.sendEmailBulk = async (emails = [], message, attachment = null) => {
  if (!emails.length) return;

  const mailOptions = {
    from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
    to: emails.join(","),
    subject: "Notification",
    text: message
  };

  // Attachment support
  if (attachment) {
    mailOptions.attachments = [
      {
        filename: attachment.originalname || "file",
        path: attachment.path
      }
    ];
  }

  await transporter.sendMail(mailOptions);
};



/* ================= SMS ================= */
const africastalking = require("africastalking")({
  apiKey: process.env.AT_API_KEY,
  username: process.env.AT_USERNAME
});

const sms = africastalking.SMS;

exports.sendSMSBulk = async (phones = [], message) => {
  if (!phones.length) return;

  // Normalize phone numbers (ensure +254...)
  const formattedPhones = phones
    .map(p => p.trim())
    .filter(Boolean);

  await sms.send({
    to: formattedPhones,
    message,
    from: process.env.SMS_FROM || undefined
  });
};



/* ================= WHATSAPP ================= */
const twilio = require("twilio");

const client = twilio(
  process.env.TWILIO_SID,
  process.env.TWILIO_AUTH_TOKEN
);

exports.sendWhatsAppBulk = async (phones = [], message, attachment = null) => {
  if (!phones.length) return;

  const from = `whatsapp:${process.env.WHATSAPP_FROM}`;

  const promises = phones.map(phone => {
    const payload = {
      from,
      to: `whatsapp:${phone}`,
      body: message
    };

    // Attachment support (media)
    if (attachment) {
      payload.mediaUrl = [attachment.url || attachment.path];
    }

    return client.messages.create(payload);
  });

  await Promise.all(promises);
};