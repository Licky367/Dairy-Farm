const service = require("../services/unpaidDeliveredOrdersService");

/* ================= ADMIN ================= */
exports.getAdminUnpaidDeliveredOrders = async (req, res) => {
    try {

        // Optional: enforce admin auth if available
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

        /* ================= GET DATA FROM SERVICE ================= */
        const result = await service.getUnpaidDeliveredOrdersByUser(
            req.session.user._id
        );

        /* ================= SAFE FALLBACK ================= */
        const orders = result?.orders || [];
        const totalArrears = Number(result?.totalArrears || 0);

        return res.render("clientUnpaidDeliveredOrders", {
            orders,
            totalArrears
        });

    } catch (err) {
        console.error(err);
        return res.status(500).send("Failed to load client orders");
    }
};