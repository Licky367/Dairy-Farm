const service = require("../services/unpaidDeliveredOrdersService");

/* ================= ADMIN ================= */
exports.getAdminUnpaidDeliveredOrders = async (req, res) => {
    try {

        // Optional admin auth
        // if (!req.session.admin) {
        //     return res.redirect("/admin/login");
        // }

        const orders = await service.getUnpaidDeliveredOrders();

        return res.render("adminUnpaidDeliveredOrders", {
            orders
        });

    } catch (err) {
        console.error(err);
        return res.status(500).send("Failed to load admin orders");
    }
};


/* ================= CLIENT ================= */
exports.getClientUnpaidDeliveredOrders = async (req, res) => {
    try {

        if (!req.session.user) {
            return res.redirect("/login");
        }

        /* ================= GET ORDERS ================= */
        const orders = await service.getUnpaidDeliveredOrdersByUser(
            req.session.user._id
        );

        /* ================= CALCULATE TOTAL ARREARS ================= */
        let totalArrears = 0;

        if (Array.isArray(orders)) {
            orders.forEach(order => {
                totalArrears += Number(order.arrearAmount || 0);
            });
        }

        return res.render("clientUnpaidDeliveredOrders", {
            orders,
            totalArrears
        });

    } catch (err) {
        console.error(err);
        return res.status(500).send("Failed to load client orders");
    }
};