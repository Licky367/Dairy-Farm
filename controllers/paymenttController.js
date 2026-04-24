const Order = require("../models/Order");
const Transaction = require("../models/Transaction");
const intasendService = require("../services/intasendService");
const { formatPhone } = require("../utils/phone");


/* ================= INITIATE PAYMENT ================= */
exports.initiatePayment = async (req, res) => {

    try {

        const { orderId, paymentType, paymentMethod } = req.body;

        const phone = formatPhone(req.session.user.phone);

        if (!phone)
            return res.send("Invalid phone");

        let amount = 0;
        let order = null;

        /* ================= BULK PAYMENT (payArrears) ================= */
        if (paymentType === "payArrears") {

            const orders = await Order.find({
                userId: req.session.user._id,
                delivered: true,
                arrearAmount: { $gt: 0 }
            });

            amount = orders.reduce(
                (sum, o) => sum + Number(o.arrearAmount || 0),
                0
            );

            if (!amount || amount <= 0) {
                return res.send("No arrears balance.");
            }
        }

        /* ================= SINGLE ORDER PAYMENTS ================= */
        else {

            order = await Order.findById(orderId);

            if (!order)
                return res.send("Order not found");

            if (paymentType === "paid") {
                amount = order.totalAmount;
            }

            else if (paymentType === "depositPaid") {
                amount = order.depositAmount;

                await Order.findByIdAndUpdate(orderId, {
                    status: "payAfter"
                });
            }

            else if (paymentType === "arrearAmount") {
                amount = order.arrearAmount;

                if (!amount || amount <= 0) {
                    return res.send("No arrears balance.");
                }
            }

            else {
                return res.send("Invalid payment type");
            }
        }

        /* ================= INTASEND CHECKOUT ================= */
        const response = await intasendService.createCheckout({
            amount,
            phone,
            email: req.session.user.email,
            paymentMethod, // M-PESA | BANK | CARD
            orderId: orderId || "BULK_ARREARS",
            paymentType
        });

        /* ================= SAVE TRANSACTION ================= */
        await Transaction.create({
            orderId: orderId || null,
            userId: req.session.user._id,
            phone,
            amount,
            paymentType,
            paymentMethod,
            provider: "intasend",
            invoiceId: response.invoice_id,
            status: "pending"
        });

        res.send(response.payment_url);

    } catch (err) {
        console.error(err);
        res.send("Payment initiation failed");
    }
};


/* ================= INTASEND WEBHOOK ================= */
exports.intasendCallback = async (req, res) => {

    try {

        const event = req.body;

        const tx = await Transaction.findOne({
            invoiceId: event.invoice_id
        });

        if (!tx) {
            return res.json({ status: "ok" });
        }

        tx.status = event.state === "COMPLETE" ? "success" : "failed";

        await tx.save();

        if (event.state !== "COMPLETE") {
            return res.json({ status: "ok" });
        }

        /* ================= SINGLE ORDER PAYMENT ================= */
        if (tx.paymentType !== "payArrears") {

            const order = await Order.findById(tx.orderId);

            if (!order) return res.json({ status: "ok" });

            if (
                tx.paymentType === "paid" ||
                tx.paymentType === "arrearAmount"
            ) {
                await Order.findByIdAndUpdate(tx.orderId, {
                    status: "paid",
                    $inc: {
                        depositAmountPaid: tx.amount
                    }
                });
            }

            else if (tx.paymentType === "depositPaid") {

                await Order.findByIdAndUpdate(tx.orderId, {
                    status: "depositPaid",
                    $inc: {
                        depositAmountPaid: tx.amount
                    }
                });
            }
        }

        /* ================= BULK PAYMENT ================= */
        else {

            const orders = await Order.find({
                userId: tx.userId,
                delivered: true,
                arrearAmount: { $gt: 0 }
            });

            let remaining = tx.amount;

            for (let o of orders) {

                if (remaining <= 0) break;

                const pay = Math.min(o.arrearAmount, remaining);

                await Order.findByIdAndUpdate(o._id, {
                    $inc: {
                        depositAmountPaid: pay
                    },
                    status: "paid"
                });

                remaining -= pay;
            }
        }

        return res.json({ status: "ok" });

    } catch (err) {
        console.error(err);
        return res.json({ status: "ok" });
    }
};