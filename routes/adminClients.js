const express = require("express");
const router = express.Router();

const {
  getAllClients,
  getClientById
} = require("../controllers/adminClientsController");

// LIST ALL CLIENTS PAGE
router.get("/admin/clients", getAllClients);

// (Optional API endpoint for single client details)
router.get("/admin/clients/:id", getClientById);

module.exports = router;