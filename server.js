const express = require("express");
const session = require("express-session");
const path = require("path");
const vhost = require("vhost");
require("dotenv").config();

/* ===============================
   DATABASE
================================= */
const connectDB = require("./db");

/* ===============================
   SEED ADMIN
================================= */
const seedAdmin = require("./models/seedAdmin");

/* ===============================
   INIT APP
================================= */
const app = express();

/* ===============================
   NOTIFICATION + SOCKET.IO
================================= */
const http = require("http");
const socketIo = require("socket.io");

const server = http.createServer(app);

const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

/* Make io accessible globally */
app.set("io", io);

io.on("connection", (socket) => {

  console.log("🟢 User connected");

  socket.on(
    "joinConversation",
    (conversationId) => {
      socket.join(conversationId);
    }
  );

  socket.on("sendMessage", (data) => {

    io.to(data.conversationId).emit(
      "newMessage",
      data
    );

  });

  socket.on("disconnect", () => {
    console.log("🔴 User disconnected");
  });

});

/* ===============================
   CONNECT DATABASE
================================= */
connectDB()
  .then(async () => {

    /* AUTO SEED ADMIN */
    await seedAdmin();

  })
  .catch((err) => {
    console.log(
      "MongoDB Connection Error:",
      err
    );
  });

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
const clientOrderRoutes = require("./routes/clientOrder");
const unpaidRoutes = require("./routes/unpaidDeliveredOrders");
const categoryRoutes = require("./routes/category");
const statsRoutes = require("./routes/stats");
const receiptRoutes = require("./routes/receiptRoutes");
const notificationsRoutes = require("./routes/notifications");

/* ===============================
   VIEW ENGINE
================================= */
app.set("view engine", "ejs");

app.set(
  "views",
  path.join(__dirname, "views")
);

const expressLayouts = require(
  "express-ejs-layouts"
);

app.use(expressLayouts);

app.set("layout", "layout");

/* ===============================
   GLOBAL MIDDLEWARE
================================= */
app.use(
  express.urlencoded({
    extended: true
  })
);

app.use(express.json());

app.use(
  express.static(
    path.join(__dirname, "public")
  )
);

app.use(
  "/uploads",
  express.static(
    path.join(__dirname, "uploads")
  )
);

/* ===============================
   SESSION
================================= */
app.use(
  session({
    secret:
      process.env.SESSION_SECRET ||
      "super-secret-key",

    resave: false,

    saveUninitialized: false,

    cookie: {
      maxAge:
        1000 * 60 * 60 * 24,

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
================================= */
const clientApp = express.Router();

/* Routes */
clientApp.use("/", authRoutes);

clientApp.use("/", profileRoutes);

clientApp.use("/", clientRoutes);

clientApp.use("/", checkoutRoutes);

clientApp.use("/", productRoutes);

clientApp.use("/", paymentRoutes);

clientApp.use("/", cartRoutes);

clientApp.use("/", clientOrderRoutes);

clientApp.use("/", unpaidRoutes);

/* Redirect root */
clientApp.get("/", (req, res) => {
  res.redirect("/client");
});

/* ===============================
   ADMIN SUBDOMAIN APP
   admin.localhost:3000
================================= */
const adminApp = express.Router();

/* Routes */
adminApp.use("/", authRoutes);

adminApp.use("/", profileRoutes);

adminApp.use("/", adminRoutes);

adminApp.use("/", unpaidRoutes);

adminApp.use(
  "/category",
  categoryRoutes
);

adminApp.use(
  "/admin",
  statsRoutes
);

adminApp.use(
  "/admin",
  receiptRoutes
);

adminApp.use(
  "/notifications",
  notificationsRoutes
);

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

/* ===============================
   MAIN SITE
================================= */
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
const PORT =
  process.env.PORT || 3000;

server.listen(PORT, () => {

  console.log(
    `🚀 Server running on port ${PORT}`
  );

});