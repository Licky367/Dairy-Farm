const Order =
require("../models/Order");

const Product =
require("../models/Product");

exports.calculateTotals =
(cart) => {

let total = 0;
let deposit = 0;

cart.forEach(item => {

total +=
item.cost *
item.quantity;

deposit +=
item.depositAmount *
item.quantity;

});

const arrear =
total - deposit;

return {
total,
deposit,
arrear
};
};

exports.createOrderAndHandlePayment =
async (
cart,
user,
paymentType
) => {

const totals =
exports.calculateTotals(cart);

/* create order */
const order =
await Order.create({

userId:user._id,

items:cart,

totalAmount:
totals.total,

depositAmount:
totals.deposit,

arrearAmount:
totals.arrear,

status:
paymentType
});

/*
If requires mpesa,
redirect to payment page
*/

if (
paymentType === "paid" ||
paymentType === "depositPaid" ||
paymentType === "arrearAmount"
) {

return {
redirectUrl:
`/payment-page/${order._id}?type=${paymentType}`
};
}

/* payAfter */
return {
redirectUrl:
"/client?success=1"
};
};