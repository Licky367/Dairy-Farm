const Order = require("../models/Order");
const ejs = require("ejs");
const path = require("path");
const receiptService = require("../services/receiptService");

/* =========================
   PAYMENT LABEL
========================= */
function getPaymentLabel(status) {
    if (status === "paid" || status === "paid(cash)") return "PAID";
    if (status === "depositPaid") return "DEPOSIT PAID ONLY";
    if (status === "payAfter") return "NOT PAID YET";
    return "UNKNOWN";
}

/* =========================
   CORE GENERATOR (SHARED)
========================= */
async function buildReceipt(order) {

    const paymentLabel = getPaymentLabel(order.status);

    const html = await ejs.renderFile(
        path.join(__dirname, "../views/receipts/receipt.ejs"),
        {
            order,
            paymentLabel,
            companyName: process.env.COMPANY_NAME,
            companyLogo: process.env.COMPANY_LOGO
        }
    );

    const pdf = await receiptService.generateReceipt(html);

    return pdf;
}

/* =========================
   ADMIN DOWNLOAD
========================= */
exports.downloadReceiptAdmin = async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);

        if (!order) {
            return res.status(404).send("Order not found");
        }

        const pdf = await buildReceipt(order);

        res.set({
            "Content-Type": "application/pdf",
            "Content-Disposition": `attachment; filename=receipt-${order._id}.pdf`
        });

        res.send(pdf);

    } catch (err) {
        console.error("Admin Receipt Error:", err);
        res.status(500).send("Error generating receipt");
    }
};

/* =========================
   CLIENT DOWNLOAD (SECURE 🔐)
========================= */
exports.downloadReceiptClient = async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);

        if (!order) {
            return res.status(404).send("Order not found");
        }

        // 🔥 SECURITY CHECK
        if (order.userId !== req.user.id) {
            return res.status(403).send("Unauthorized");
        }

        const pdf = await buildReceipt(order);

        const isPrint = req.query.print === "true";

res.set({
    "Content-Type": "application/pdf",
    "Content-Disposition": isPrint
        ? "inline"
        : `attachment; filename=receipt-${order._id}.pdf`
});

        res.send(pdf);

    } catch (err) {
        console.error("Client Receipt Error:", err);
        res.status(500).send("Error generating receipt");
    }
};