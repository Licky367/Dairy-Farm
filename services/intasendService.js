const axios = require("axios");

const INTASEND_BASE_URL = "https://payment.intasend.com/api/v1";

/**
 * CREATE CHECKOUT SESSION
 */
exports.createCheckout = async ({
    amount,
    phone,
    email,
    paymentMethod,
    orderId,
    paymentType
}) => {

    try {

        const payload = {
            amount: amount,
            currency: "KES",

            // customer info
            phone_number: phone,
            email: email,

            // metadata for tracking (VERY IMPORTANT)
            reference: orderId,
            comment: paymentType,

            // payment method preference
            method: paymentMethod, 
        };

        const response = await axios.post(
            `${INTASEND_BASE_URL}/checkout/`,
            payload,
            {
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${process.env.INTASEND_API_KEY}`
                }
            }
        );

        /**
         * Expected response shape (typical IntaSend pattern):
         * {
         *   id: "invoice_id",
         *   url: "https://checkout.intasend.com/...",
         *   status: "PENDING"
         * }
         */

        return {
            invoice_id: response.data.id,
            payment_url: response.data.url,
            status: response.data.status
        };

    } catch (err) {
        console.error("IntaSend Checkout Error:", err.response?.data || err.message);
        throw new Error("Failed to create payment checkout");
    }
};