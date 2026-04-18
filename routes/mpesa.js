const express = require("express");
const router = express.Router();

router.post("/mpesa/callback", (req, res) => {
    console.log("M-Pesa Response:", req.body);

    res.json({ ResultCode: 0, ResultDesc: "Success" });
});

module.exports = router;