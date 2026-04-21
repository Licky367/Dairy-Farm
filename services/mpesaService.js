const axios = require("axios");

const BASE_URL =
    process.env.MPESA_ENV === "live"
        ? "https://api.safaricom.co.ke"
        : "https://sandbox.safaricom.co.ke";

/**
 * GET ACCESS TOKEN
 */
const getToken = async () => {

    const auth = Buffer.from(
        process.env.MPESA_CONSUMER_KEY +
        ":" +
        process.env.MPESA_CONSUMER_SECRET
    ).toString("base64");

    const res = await axios.get(
        `${BASE_URL}/oauth/v1/generate?grant_type=client_credentials`,
        {
            headers: {
                Authorization: `Basic ${auth}`
            }
        }
    );

    return res.data.access_token;
};

/**
 * FORMAT TIMESTAMP (SAFER FOR SAFARICOM)
 */
function getTimestamp() {

    const now = new Date();

    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    const hours = String(now.getHours()).padStart(2, "0");
    const minutes = String(now.getMinutes()).padStart(2, "0");
    const seconds = String(now.getSeconds()).padStart(2, "0");

    return `${year}${month}${day}${hours}${minutes}${seconds}`;
}

/**
 * STK PUSH INITIATION
 */
exports.stkPush = async (phone, amount, orderId) => {

    const token = await getToken();

    const timestamp = getTimestamp();

    const password = Buffer.from(
        process.env.MPESA_SHORTCODE +
        process.env.MPESA_PASSKEY +
        timestamp
    ).toString("base64");

    const payload = {
        BusinessShortCode: process.env.MPESA_SHORTCODE,
        Password: password,
        Timestamp: timestamp,

        TransactionType: "CustomerPayBillOnline",
        Amount: amount,

        PartyA: phone,
        PartyB: process.env.MPESA_SHORTCODE,
        PhoneNumber: phone,

        CallBackURL: process.env.MPESA_CALLBACK_URL,

        AccountReference: orderId.toString(),
        TransactionDesc: "Electro-Aid Payment"
    };

    try {

        const res = await axios.post(
            `${BASE_URL}/mpesa/stkpush/v1/processrequest`,
            payload,
            {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            }
        );

        return res.data;

    } catch (err) {

        console.error(
            "M-Pesa STK Push Error:",
            err.response?.data || err.message
        );

        throw new Error("Failed to initiate M-Pesa STK Push");
    }
};