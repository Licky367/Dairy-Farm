const express = require("express");
const mongoose = require("mongoose");
const session = require("express-session");
const path = require("path");
const vhost = require("vhost");
require("dotenv").config();

const app = express();

/* ===============================
   IMPORT ROUTES
================================= */
const authRoutes = require("./routes/auth");
const profileRoutes = require("./routes/profile");
const clientRoutes = require("./routes/client");
const adminRoutes = require("./routes/admin");
const checkoutRoutes = require("./routes/checkout");
const productRoutes = require("./routes/product");
const paymentRoutes = require("./routes/payment");

/* ===============================
   DATABASE
================================= */
mongoose.connect(process.env.MONGO_URI)
.then(() => console.log("MongoDB Connected"))
.catch((err) => console.log(err));

/* ===============================
   VIEW ENGINE
================================= */
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

/* ===============================
   GLOBAL MIDDLEWARE
================================= */
app.use(express.urlencoded({ extended:true }));
app.use(express.json());

app.use(express.static("public"));
app.use(
"/uploads",
express.static(
path.join(__dirname,"public/uploads")
)
);

/* ===============================
   SESSION
================================= */
app.use(
session({
secret: process.env.SESSION_SECRET,
resave:false,
saveUninitialized:false,
cookie:{
maxAge:
1000*60*60*24
}
})
);

/* ===============================
   VIEW VARIABLES
================================= */
app.use((req,res,next)=>{

res.locals.user =
req.session.user || null;

res.locals.cart =
req.session.cart || [];

next();

});

/* ===============================
   MAIN CLIENT APP
   domain.com
   entry = /client
================================= */
const clientApp = express.Router();

clientApp.use("/", authRoutes);
clientApp.use("/", profileRoutes);
clientApp.use("/", clientRoutes);
clientApp.use("/", checkoutRoutes);
clientApp.use("/", productRoutes);
clientApp.use("/", paymentRoutes);

/* redirect root */
clientApp.get("/", (req,res)=>{
res.redirect("/client");
});

/* ===============================
   ADMIN SUBDOMAIN APP
   admin.domain.com
   entry = /admin/dashboard
================================= */
const adminApp = express.Router();

adminApp.use("/", authRoutes);
adminApp.use("/", profileRoutes);
adminApp.use("/", adminRoutes);
adminApp.use("/", productRoutes);

/* redirect root */
adminApp.get("/", (req,res)=>{
res.redirect("/admin/dashboard");
});

/* ===============================
   SUBDOMAIN BINDING
================================= */

/*
LIVE:

admin.yourdomain.com
www.yourdomain.com
*/

app.use(
vhost(
process.env.ADMIN_SUBDOMAIN,
adminApp
)
);

/*
main site
*/
app.use(clientApp);

/* ===============================
   404
================================= */
app.use((req,res)=>{
res.status(404).send(
"Page Not Found"
);
});

/* ===============================
   SERVER
================================= */
app.listen(
process.env.PORT,
()=>{
console.log(
`Server running on port ${process.env.PORT}`
);
});