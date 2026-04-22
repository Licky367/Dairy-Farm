const service = require("../services/unpaidDeliveredOrdersService");

/* ================= ADMIN ================= */
exports.getAdminUnpaidDeliveredOrders = async (req, res) => {
    try {

        // (optional) add admin auth check if you have one
        // if (!req.session.admin) return res.redirect("/admin/login");

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

        const orders = await service.getUnpaidDeliveredOrdersByUser(
            req.session.user._id
        );

        /* ================= 🔥 ADD TOTAL ARREARS ================= */
        let totalArrears = 0;

        const normalizedOrders = orders.map(order => {
            const arrears = Number(order.arrearAmount || 0);
            totalArrears += arrears;

            return {
                ...order,
                arrearAmount: arrears
            };
        });

        return res.render("clientUnpaidDeliveredOrders", {
            orders: normalizedOrders,
            totalArrears
        });

    } catch (err) {
        console.error(err);
        return res.status(500).send("Failed to load client orders");
    }
};