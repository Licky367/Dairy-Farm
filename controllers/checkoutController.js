const checkoutService =
require("../services/checkoutService");

exports.checkoutPage =
async (req, res) => {

const cart =
req.session.cart || [];

if (cart.length === 0) {
return res.redirect("/client");
}

const totals =
checkoutService.calculateTotals(cart);

res.render("checkout", {
cart,
totals,
user:req.session.user || null
});
};

exports.processCheckout =
async (req, res) => {

try {

const cart =
req.session.cart || [];

if (cart.length === 0) {
return res.send("Cart empty");
}

if (!req.session.user) {
return res.redirect("/login");
}

const {
paymentType
} = req.body;

const result =
await checkoutService
.createOrderAndHandlePayment(
cart,
req.session.user,
paymentType
);

/* clear cart */
req.session.cart = [];

res.redirect(
result.redirectUrl
);

} catch (err) {

res.send(
"Checkout failed"
);

}
};