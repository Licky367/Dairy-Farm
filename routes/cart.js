const express = require("express");
const router = express.Router();

const cartController = require("../controllers/cartController");

router.get("/", cartController.viewCart);

router.post("/add/:id", cartController.addToCart);

router.post("/remove/:id", cartController.removeFromCart);

router.post("/increase/:id", cartController.increaseQty);

router.post("/decrease/:id", cartController.decreaseQty);

router.post("/clear", cartController.clearCart);

module.exports = router;