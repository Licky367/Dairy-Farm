const User = require("../models/User");

/* ================= FETCH ALL CLIENTS ================= */
exports.fetchAllClients = async () => {
  return await User.find({ role: "client" })
    .select("id name email phone profileImage role createdAt")
    .sort({ createdAt: -1 });
};

/* ================= FETCH SINGLE CLIENT ================= */
exports.fetchClientById = async (id) => {
  return await User.findOne({
    $or: [{ _id: id }, { id: id }],
    role: "client"
  }).select("id name email phone profileImage role createdAt");
};