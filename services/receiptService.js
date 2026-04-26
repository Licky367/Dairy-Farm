// services/receiptService.js
const PDFDocument = require("pdfkit");

exports.generateReceipt = (order, res) => {

    const doc = new PDFDocument();

    // 🔽 download headers
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
        "Content-Disposition",
        `attachment; filename=receipt-${order._id}.pdf`
    );

    doc.pipe(res);

    // =========================
    // COMPANY
    // =========================
    doc.fontSize(18).text(process.env.COMPANY_NAME || "My Company");

    doc.moveDown();

    // =========================
    // ORDER INFO
    // =========================
    doc.fontSize(12).text(`Order ID: ${order._id}`);
    doc.text(`Customer: ${order.customerName}`);
    doc.text(`Date: ${new Date(order.orderedAt).toLocaleString()}`);

    doc.moveDown();

    // =========================
    // PAYMENT STATUS
    // =========================
    const status = order.status;

    let paymentLabel = "UNKNOWN";

    if (status === "paid" || status === "paid(cash)") {
        paymentLabel = "PAID";
    } else if (status === "depositPaid") {
        paymentLabel = "DEPOSIT PAID ONLY";
    } else if (status === "payAfter") {
        paymentLabel = "NOT PAID YET";
    }

    doc.fontSize(14).text(`Payment Status: ${paymentLabel}`);

    doc.moveDown();

    // =========================
    // ITEMS
    // =========================
    doc.text("Items:");

    order.items.forEach(item => {
        doc.text(
            `${item.name} | Qty: ${item.quantity} | KES ${item.cost}`
        );
    });

    doc.moveDown();

    // =========================
    // TOTALS
    // =========================
    doc.text(`Total: KES ${order.totalAmount}`);
    doc.text(`Deposit Paid: KES ${order.depositAmountPaid}`);
    doc.text(`Balance: KES ${order.arrearAmount}`);
    doc.text(`Shipping: KES ${order.shippingCost}`);

    doc.end();
};