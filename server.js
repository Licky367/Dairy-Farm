const express = require("express");
const mongoose = require("mongoose");
const session = require("express-session");
const path = require("path");

const authRoutes = require("./routes/auth");
const profileRoutes = require("./routes/profile");

const app = express();

mongoose.connect("mongodb://127.0.0.1:27017/authDB")
.then(()=>console.log("MongoDB Connected"));

app.set("view engine", "ejs");
app.set("views", path.join(__dirname,"views"));

app.use(express.urlencoded({extended:true}));
app.use(express.static("public"));

app.use(session({
    secret:"secretkey",
    resave:false,
    saveUninitialized:false
}));

app.use("/", authRoutes);
app.use("/", profileRoutes);

app.listen(3000,()=>{
    console.log("Server running on port 3000");
});