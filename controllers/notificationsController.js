const notificationService = require("../services/notificationsService");

exports.renderPage = async (req, res) => {
  res.render("notifications", {
    title: "Notifications"
  });
};

exports.renderPage = async (req, res) => {
  const users = await User.find().select("name email phone");

  res.render("notifications", {
    title: "Notifications",
    users,
    query: req.query
  });
};

manualEmails: manualEmails 
  ? manualEmails.split(",").map(e => e.trim()).filter(Boolean)
  : [],

manualPhones: manualPhones 
  ? manualPhones.split(",").map(p => p.trim()).filter(Boolean)
  : [],

exports.sendNotification = async (req, res) => {
  try {
    const {
      channel,
      message,
      userIds,
      sendToAll,
      manualEmails,
      manualPhones
    } = req.body;

    await notificationService.processNotification({
      channel,
      message,
      userIds: userIds ? [].concat(userIds) : [],
      sendToAll: sendToAll === "on",
      manualEmails: manualEmails ? manualEmails.split(",") : [],
      manualPhones: manualPhones ? manualPhones.split(",") : [],
      senderId: req.user._id
    });

    res.redirect("/notifications?success=1");

  } catch (error) {
    console.error(error);
    res.redirect("/notifications?error=1");
  }
};