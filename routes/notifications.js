const express = require("express");
const router = express.Router();

const notificationsController = require("../controllers/notificationsController");

// middleware assumed (auth)
router.get("/", notificationsController.renderPage);

router.post("/send", notificationsController.sendNotification);

module.exports = router;