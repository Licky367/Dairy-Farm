const profileService = require("../services/profileService");

exports.profilePage = async (req, res) => {
    const userId = req.session.user._id;

    const user = await profileService.getUser(userId);

    res.render("profile", { user });
};

exports.updateProfile = async (req, res) => {
    const userId = req.session.user._id;

    await profileService.updateUser(userId, req.body);

    res.redirect("/profile");
};