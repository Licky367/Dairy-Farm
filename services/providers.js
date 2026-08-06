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
let sms = null;

const atApiKey = process.env.AT_API_KEY;
const atUsername = process.env.AT_USERNAME;

if (atApiKey && atUsername) {
  try {
    const africastalking = require("africastalking");
    const africastalkingClient = africastalking({
      apiKey: atApiKey,
      username: atUsername
    });

    sms = africastalkingClient.SMS;
  } catch (err) {
    console.warn("SMS provider initialization skipped:", err.message);
  }
}

exports.sendSMSBulk = async (phones = [], message) => {
  if (!phones.length || !sms) return;

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
let twilioClient = null;

if (process.env.TWILIO_SID && process.env.TWILIO_AUTH_TOKEN) {
  try {
    const twilio = require("twilio");
    twilioClient = twilio(
      process.env.TWILIO_SID,
      process.env.TWILIO_AUTH_TOKEN
    );
  } catch (err) {
    console.warn("WhatsApp provider initialization skipped:", err.message);
  }
}

exports.sendWhatsAppBulk = async (phones = [], message, attachment = null) => {
  if (!phones.length || !twilioClient) return;

  const from = `whatsapp:${process.env.WHATSAPP_FROM}`;

  const promises = phones.map(phone => {
    const payload = {
      from,
      to: `whatsapp:${phone}`,
      body: message
    };

    if (attachment) {
      payload.mediaUrl = [attachment.url || attachment.path];
    }

    return twilioClient.messages.create(payload);
  });

  await Promise.all(promises);
};