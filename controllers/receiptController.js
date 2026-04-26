// controllers/receiptController.js
const Order = require("../models/Order");
const receiptService = require("../services/receiptService");

exports.downloadReceipt = async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);

        if (!order) {
            return res.status(404).json({ message: "Order not found" });
        }

        receiptService.generateReceipt(order, res);

    } catch (err) {
        console.error("Receipt Error:", err);
        res.status(500).json({ message: err.message });
    }
};