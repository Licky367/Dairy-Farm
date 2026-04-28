const notificationService = require("../services/notificationsService");
const User = require("../models/User");

exports.renderPage = async (req, res) => {
  const users = await User.find().select("name");

  res.render("notifications", {
    title: "Notifications",
    users
  });
};

exports.sendNotification = async (req, res) => {
  try {
    const {
      channel,
      subject,
      message,
      userId,
      userIds,
      sendToAll
    } = req.body;

    await notificationService.processNotification({
      channel,
      subject,
      message,
      userIds: userIds ? [].concat(userIds) : [],
      sendToAll: sendToAll === "on",
      senderId: req.user._id,
      attachment: req.file || null
    });

    res.redirect("/notifications?success=1");

  } catch (err) {
    console.error(err);
    res.redirect("/notifications?error=1");
  }
};