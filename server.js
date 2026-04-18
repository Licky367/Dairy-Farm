const express = require("express");
const mongoose = require("mongoose");
const session = require("express-session");
const path = require("path");
require("dotenv").config();

const authRoutes = require("./routes/auth");
const profileRoutes = require("./routes/profile");
const clientRoutes = require("./routes/client");
const adminRoutes = require("./routes/admin");
const checkoutRoutes = require("./routes/checkout");
const productRoutes = require("./routes/product");
const mpesaRoutes = require("./routes/mpesa");

const app = express();

/* MongoDB Connection */
mongoose.connect("mongodb://127.0.0.1:27017/authDB")
.then(() => console.log("MongoDB Connected"))
.catch((err) => console.log(err));

/* View Engine */
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

/* Middlewares */
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(express.static("public"));
app.use("/uploads", express.static(path.join(__dirname, "public/uploads")));

/* Session */
app.use(
    session({
        secret: "secretkey",
        resave: false,
        saveUninitialized: false,
        cookie: {
            maxAge: 1000 * 60 * 60 * 24
        }
    })
);

/* Global Variables for Views */
app.use((req, res, next) => {
    res.locals.user = req.session.user || null;
    res.locals.cart = req.session.cart || [];
    next();
});

/* Routes */
app.use("/", authRoutes);
app.use("/", profileRoutes);
app.use("/", clientRoutes);
app.use("/", adminRoutes);
app.use("/", checkoutRoutes);
app.use("/", productRoutes);
app.use("/", mpesaRoutes);

/* 404 */
app.use((req, res) => {
    res.status(404).send("Page Not Found");
});

/* Server */
app.listen(3000, () => {
    console.log("Server running on port 3000");
});