const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");

router.get("/signup", authController.signupPage);
router.post("/signup", authController.signup);

router.get("/login", authController.loginPage);
router.post("/login", authController.login);

router.get("/forgot-password", authController.forgotPage);
router.post("/forgot-password", authController.forgotPassword);

router.get("/reset-password/:id", authController.resetPage);
router.post("/reset-password/:id", authController.resetPassword);

router.get("/logout", authController.logout);

module.exports = router;