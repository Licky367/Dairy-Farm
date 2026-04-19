const authService = require("../services/authService");

exports.signupPage = (req, res) => {
    res.render("signup");
};

exports.signup = async (req, res) => {
    await authService.createUser(req.body);
    res.redirect("/login");
};

exports.loginPage = (req, res) => {
    res.render("login");
};

exports.login = async (req, res) => {
    const user = await authService.loginUser(req.body);

    if (!user) return res.send("Invalid Credentials");

    req.session.user = user;

    // Redirect based on role
    if (user.role === "admin") {
        return res.redirect("/admin/dashboard");
    } else {
        return res.redirect("/client");
    }
};

exports.forgotPage = (req, res) => {
    res.render("forgot-password");
};

exports.forgotPassword = async (req, res) => {
    const user = await authService.findEmail(req.body.email);

    if (!user) return res.send("Email not found");

    res.redirect(`/reset-password/${user._id}`);
};

exports.resetPage = (req, res) => {
    res.render("reset-password", { id: req.params.id });
};

exports.resetPassword = async (req, res) => {
    await authService.resetPassword(req.params.id, req.body.password);
    res.redirect("/login");
};

exports.logout = (req, res) => {
    req.session.destroy(() => {
        res.render("logout");
    });
};