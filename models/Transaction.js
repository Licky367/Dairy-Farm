const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema(
{
    orderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Order",
        required: true
    },

    phone: String,

    amount: Number,

    paymentType: {
        type: String,
        enum: [
            "paid",
            "depositPaid",
            "arrearAmount"
        ]
    },

    checkoutRequestID: String,
    merchantRequestID: String,

    mpesaReceiptNumber: String,

    status: {
        type: String,
        enum: [
            "pending",
            "success",
            "failed"
        ],
        default: "pending"
    },

    resultCode: Number,
    resultDesc: String
},
{ timestamps: true }
);

module.exports =
mongoose.model(
"Transaction",
transactionSchema
);