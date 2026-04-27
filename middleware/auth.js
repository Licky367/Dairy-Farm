exports.isLoggedIn = (req, res, next) => {
    if (!req.session.user) {
        return res.redirect("/login");
    }
    next();
};

exports.isAdmin = (req, res, next) => {
    if (!req.session.user || req.session.user.role !== "admin") {
        return res.redirect("/login");
    }
    next();
};

exports.ensureAuth = (req, res, next) => {
  if (!req.session.user) return res.redirect("/login");
  next();
};