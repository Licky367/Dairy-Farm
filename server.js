const express = require("express");
const session = require("express-session");
const path = require("path");
const vhost = require("vhost");
require("dotenv").config();

const connectDB = require("./db");

const app = express();

/* ===============================
   CONNECT DATABASE
================================= */
connectDB();

/* ===============================
   IMPORT ROUTES
================================= */
const authRoutes = require("./routes/auth");
const profileRoutes = require("./routes/profile");
const clientRoutes = require("./routes/client");
const adminRoutes = require("./routes/admin");
const checkoutRoutes = require("./routes/checkout");
const productRoutes = require("./routes/product");
const cartRoutes = require("./routes/cart");
const paymentRoutes = require("./routes/payment");

/* ===============================
   VIEW ENGINE
================================= */
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

/* ===============================
   GLOBAL MIDDLEWARE
================================= */
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(express.static("public"));

app.use(
  "/uploads",
  express.static(
    path.join(__dirname, "public/uploads")
  )
);

/* ===============================
   SESSION
================================= */
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 1000 * 60 * 60 * 24,
      httpOnly: true,
      secure: false
    }
  })
);

/* ===============================
   GLOBAL VIEW VARIABLES
================================= */
app.use((req, res, next) => {
  res.locals.user =
    req.session.user || null;

  res.locals.cart =
    req.session.cart || [];

  next();
});

/* ===============================
   MAIN CLIENT APP
   localhost:3000
   entry => /client
================================= */
const clientApp = express.Router();

clientApp.use("/", authRoutes);
clientApp.use("/", profileRoutes);
clientApp.use("/", clientRoutes);
clientApp.use("/", checkoutRoutes);
clientApp.use("/", productRoutes);
clientApp.use("/", paymentRoutes);
clientApp.use("/", cartRoutes);

/* Redirect root */
clientApp.get("/", (req, res) => {
  res.redirect("/client");
});

/* ===============================
   ADMIN SUBDOMAIN APP
   admin.localhost:3000
   entry => /admin/dashboard
================================= */
const adminApp = express.Router();

adminApp.use("/", authRoutes);
adminApp.use("/", profileRoutes);
adminApp.use("/", adminRoutes);

/* Redirect root */
adminApp.get("/", (req, res) => {
  res.redirect("/admin/dashboard");
});

/* ===============================
   SUBDOMAIN BINDING
================================= */
app.use(
  vhost(
    process.env.ADMIN_SUBDOMAIN,
    adminApp
  )
);

/* Main site */
app.use(clientApp);

/* ===============================
   404 HANDLER
================================= */
app.use((req, res) => {
  res.status(404).send(
    "Page Not Found"
  );
});

/* ===============================
   SERVER START
================================= */
app.listen(
  process.env.PORT,
  () => {
    console.log(
      `Server running on port ${process.env.PORT}`
    );
  }
);