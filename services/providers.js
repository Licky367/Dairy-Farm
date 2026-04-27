// EMAIL
const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

exports.sendEmailBulk = async (emails, message) => {
  if (!emails.length) return;

  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: emails.join(","),
    subject: "Notification",
    text: message
  });
};


// SMS (Africa's Talking example)
const africastalking = require("africastalking")({
  apiKey: process.env.AT_API_KEY,
  username: process.env.AT_USERNAME
});

const sms = africastalking.SMS;

exports.sendSMSBulk = async (phones, message) => {
  if (!phones.length) return;

  await sms.send({
    to: phones,
    message
  });
};


// WHATSAPP (Twilio example)
const twilio = require("twilio");

const client = twilio(
  process.env.TWILIO_SID,
  process.env.TWILIO_AUTH_TOKEN
);

exports.sendWhatsAppBulk = async (phones, message) => {
  if (!phones.length) return;

  const promises = phones.map(phone =>
    client.messages.create({
      from: "whatsapp:+14155238886",
      to: `whatsapp:${phone}`,
      body: message
    })
  );

  await Promise.all(promises);
};