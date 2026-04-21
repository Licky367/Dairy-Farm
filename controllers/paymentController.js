const Order = require("../models/Order");
const Transaction = require("../models/Transaction");
const mpesaService = require("../services/mpesaService");
const { formatPhone } = require("../utils/phone");

/*
paymentType can be:

paid
depositPaid
payAfter
arrearAmount
*/

exports.initiatePayment = async (req, res) => {

    try {

        const { orderId, paymentType } = req.body;

        const order = await Order.findById(orderId);

        if (!order)
            return res.send("Order not found");

        const phone = formatPhone(req.session.user.phone);

        if (!phone)
            return res.send("Invalid phone");

        let amount = 0;

        /* ================= PAYMENT RULES ================= */

        // FULL PAYMENT or PAY LATER PAYMENT
        if (paymentType === "paid" || paymentType === "payAfter") {
            amount = order.totalAmount;
        }

        // DEPOSIT PAYMENT
        else if (paymentType === "depositPaid") {
            amount = order.depositAmount;

            await Order.findByIdAndUpdate(orderId, {
                status: "payAfter"
            });
        }

        // ARREARS PAYMENT
        else if (paymentType === "arrearAmount") {
            amount = order.arrearAmount;

            if (!amount || amount <= 0) {
                return res.send("No arrears balance.");
            }
        }

        // INVALID TYPE
        else {
            return res.send("Invalid payment type");
        }

        /* ================= STK PUSH ================= */

        const response = await mpesaService.stkPush(
            phone,
            amount,
            order._id
        );

        /* ================= SAVE TRANSACTION ================= */

        await Transaction.create({
            orderId: order._id,
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


/* ================= CALLBACK ================= */

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

            /* ================= ORDER STATUS UPDATE ================= */

            if (tx.paymentType === "paid") {

                await Order.findByIdAndUpdate(tx.orderId, {
                    status: "paid"
                });

            }

            else if (tx.paymentType === "depositPaid") {

                await Order.findByIdAndUpdate(tx.orderId, {
                    status: "depositPaid"
                });

            }

            else if (tx.paymentType === "arrearAmount") {

                await Order.findByIdAndUpdate(tx.orderId, {
                    status: "paid"
                });

            }

        } else {
            tx.status = "failed";
        }

        await tx.save();

        res.json({
            ResultCode: 0,
            ResultDesc: "OK"
        });

    } catch (err) {

        console.error(err);

        res.json({
            ResultCode: 0,
            ResultDesc: "OK"
        });
    }
};