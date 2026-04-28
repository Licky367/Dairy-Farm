const notificationService = require("../services/notificationsService");
const User = require("../models/User");


/* ===============================
   RENDER PAGE
================================= */
exports.renderPage = async (req, res) => {
  try {
    const users = await User.find().select("name email phone");

    res.render("notifications", {
      title: "Notifications",
      users,
      query: req.query
    });

  } catch (error) {
    console.error("Render Notifications Error:", error);
    res.status(500).send("Server Error");
  }
};


/* ===============================
   SEND NOTIFICATION / MESSAGE
================================= */
exports.sendNotification = async (req, res) => {
  try {
    const {
      channel,
      message,
      userId,       // NEW: single chat mode
      userIds,      // existing bulk support
      sendToAll,
      manualEmails,
      manualPhones
    } = req.body;

    /* ===============================
       NORMALIZE INPUTS (LIGHT ONLY)
       Controller stays thin
    =============================== */

    const normalizedUserIds = userId
      ? [userId]                          // chat UI sends single user
      : userIds
        ? [].concat(userIds)              // form fallback
        : [];

    const emails = manualEmails
      ? manualEmails.split(",").map(e => e.trim()).filter(Boolean)
      : [];

    const phones = manualPhones
      ? manualPhones.split(",").map(p => p.trim()).filter(Boolean)
      : [];

    /* ===============================
       DELEGATE TO SERVICE
    =============================== */
    await notificationService.processNotification({
      channel,
      message,
      userIds: normalizedUserIds,
      sendToAll: sendToAll === "on",
      manualEmails: emails,
      manualPhones: phones,
      senderId: req.user._id,
      attachment: req.file || null   // ready for attachments
    });

    /* ===============================
       RESPONSE (SMART)
    =============================== */
    if (req.xhr || (req.headers.accept || "").includes("json")) {
      return res.json({ success: true });
    }

    res.redirect("/notifications?success=1");

  } catch (error) {
    console.error("Send Notification Error:", error);

    if (req.xhr || (req.headers.accept || "").includes("json")) {
      return res.status(500).json({ success: false });
    }

    res.redirect("/notifications?error=1");
  }
};