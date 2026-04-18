const User = require("../models/User");

exports.getUser = async (id) => {
    return await User.findById(id);
};

exports.updateUser = async (id, data) => {
    return await User.findByIdAndUpdate(id, {
        name: data.name,
        email: data.email,
        phone: data.phone
    });
};