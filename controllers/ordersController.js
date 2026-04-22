const ordersService = require("../services/ordersService");

/* ================= GET ALL ORDERS (SUMMARY PAGE) ================= */
exports.getAllOrders = async (req, res) => {
  try {
    const filters = req.query;

    const orders = await ordersService.getAllOrders(filters);

    res.render("orders", {
      orders,
      query: filters
    });

  } catch (err) {
    console.error("Error fetching orders:", err);
    res.status(500).send("Server Error");
  }
};


/* ================= GET SINGLE ORDER DETAILS ================= */
exports.getOrderDetails = async (req, res) => {
  try {
    const order = await ordersService.getOrderById(req.params.id);

    if (!order) return res.status(404).send("Order not found");

    res.render("adminOrderDetails", { order });

  } catch (err) {
    console.error("Error fetching order details:", err);
    res.status(500).send("Server Error");
  }
};


/* ================= MARK AS CASH PAID ================= */
exports.markAsPaidCash = async (req, res) => {
  try {
    const adminName = req.user?.name || "Admin"; // adjust if auth differs

    await ordersService.markAsPaid(req.params.id, adminName);

    res.redirect(`/admin/orders/${req.params.id}`);

  } catch (err) {
    console.error("Error marking paid:", err);
    res.status(500).send("Server Error");
  }
};


/* ================= MARK AS DELIVERED ================= */
exports.markAsDelivered = async (req, res) => {
  try {
    const { shippingCost } = req.body;

    await ordersService.markAsDelivered(req.params.id, shippingCost);

    res.redirect(`/admin/orders/${req.params.id}`);

  } catch (err) {
    console.error("Error marking delivered:", err);
    res.status(500).send("Server Error");
  }
};