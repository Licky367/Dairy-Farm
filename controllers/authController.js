const authService = require("../services/authService");

exports.signupPage = (req, res) => {
    res.render("signup");
};

exports.signup = async (req, res) => {
    try {
        // ✅ pass req.file for profile image support
        await authService.createUser(req.body, req.file);

        res.redirect("/login");
    } catch (err) {
        res.status(400).send(err.message);
    }
};

exports.loginPage = (req, res) => {
    res.render("login");
};

exports.login = async (req, res) => {
    try {
        const user = await authService.loginUser(req.body);

        if (!user) return res.send("Invalid Credentials");

        req.session.user = user;

        // Redirect based on role
        if (user.role === "client") {
            return res.redirect("/client");
        } else {
            return res.redirect("/admin/dashboard");
        }

    } catch (err) {
        res.status(500).send("Login failed");
    }
};

exports.forgotPage = (req, res) => {
    res.render("forgot-password");
};

exports.forgotPassword = async (req, res) => {
    try {
        const user = await authService.findEmail(req.body.email);

        if (!user) return res.send("Email not found");

        res.redirect(`/reset-password/${user._id}`);
    } catch (err) {
        res.status(500).send("Something went wrong");
    }
};

exports.resetPage = (req, res) => {
    res.render("reset-password", { id: req.params.id });
};

exports.resetPassword = async (req, res) => {
    try {
        await authService.resetPassword(req.params.id, req.body.password);
        res.redirect("/login");
    } catch (err) {
        res.status(500).send("Password reset failed");
    }
};

exports.logout = (req, res) => {
    req.session.destroy(() => {
        res.render("logout");
    });
};