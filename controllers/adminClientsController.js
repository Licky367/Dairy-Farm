const {
  fetchAllClients,
  fetchClientById
} = require("../services/adminClientsServices");

/* ================= GET ALL CLIENTS ================= */
exports.getAllClients = async (req, res) => {
  try {
    const clients = await fetchAllClients();

    res.render("adminClients", {
      title: "Admin Clients",
      user: req.user,
      clients
    });

  } catch (err) {
    console.error("Error loading clients:", err);
    res.status(500).send("Failed to load clients");
  }
};

/* ================= GET SINGLE CLIENT ================= */
exports.getClientById = async (req, res) => {
  try {
    const client = await fetchClientById(req.params.id);

    if (!client) {
      return res.status(404).json({ message: "Client not found" });
    }

    res.json(client);

  } catch (err) {
    console.error("Error fetching client:", err);
    res.status(500).json({ message: "Server error" });
  }
};