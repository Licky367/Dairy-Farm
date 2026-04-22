const Order = require("../models/Order");
const Transaction = require("../models/Transaction");
const mpesaService = require("../services/mpesaService");
const { formatPhone } = require("../utils/phone");


/* ================= INITIATE PAYMENT ================= */
exports.initiatePayment = async (req, res) => {

    try {

        const { orderId, paymentType } = req.body;

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

        /* ================= STK PUSH ================= */
        const response = await mpesaService.stkPush(
            phone,
            amount,
            orderId || "BULK_ARREARS"
        );

        /* ================= SAVE TRANSACTION ================= */
        await Transaction.create({
            orderId: orderId || null,
            phone,
            amount,
            paymentType,
            checkoutRequestID: response.CheckoutRequestID,
            merchantRequestID: response.MerchantRequestID
        });

        res.send("STK Push sent. Check phone.");

    } catch (err) {
        console.error(err);
        res.send("Payment initiation failed");
    }
};


/* ================= MPESA CALLBACK ================= */
exports.mpesaCallback = async (req, res) => {

    try {

        const callback = req.body.Body.stkCallback;

        const tx = await Transaction.findOne({
            checkoutRequestID: callback.CheckoutRequestID
        });

        if (!tx) {
            return res.json({
                ResultCode: 0,
                ResultDesc: "OK"
            });
        }

        tx.resultCode = callback.ResultCode;
        tx.resultDesc = callback.ResultDesc;

        if (callback.ResultCode === 0) {

            tx.status = "success";

            const items = callback.CallbackMetadata.Item;

            const receipt = items.find(
                i => i.Name === "MpesaReceiptNumber"
            );

            if (receipt) {
                tx.mpesaReceiptNumber = receipt.Value;
            }

            /* ================= SINGLE ORDER PAYMENT ================= */
            if (tx.paymentType !== "payArrears") {

                const order = await Order.findById(tx.orderId);

                if (!order) {
                    return res.json({
                        ResultCode: 0,
                        ResultDesc: "OK"
                    });
                }

                if (
                    tx.paymentType === "paid" ||
                    tx.paymentType === "arrearAmount"
                ) {
                    await Order.findByIdAndUpdate(tx.orderId, {
                        status: "paid"
                    });
                }

                else if (tx.paymentType === "depositPaid") {

                    const depositItem = items.find(
                        i => i.Name === "Amount"
                    );

                    const paidDeposit = depositItem
                        ? depositItem.Value
                        : tx.amount;

                    await Order.findByIdAndUpdate(tx.orderId, {
                        status: "depositPaid",
                        depositAmountPaid: paidDeposit
                    });
                }
            }

            /* ================= BULK PAYMENT (payArrears) ================= */
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

        } else {
            tx.status = "failed";
        }

        await tx.save();

        return res.json({
            ResultCode: 0,
            ResultDesc: "OK"
        });

    } catch (err) {
        console.error(err);

        return res.json({
            ResultCode: 0,
            ResultDesc: "OK"
        });
    }
};