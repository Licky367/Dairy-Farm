const User = require("../models/User");
const bcrypt = require("bcrypt");

/**
 * Create new user (CLIENT ONLY)
 * @param {Object} data - form data
 * @param {Object} file - multer file (optional)
 */
exports.createUser = async (data, file = null) => {
    // 🔒 Prevent role injection
    if (data.role) {
        throw new Error("Role assignment not allowed");
    }

    // 🔐 Hash password
    const hashed = await bcrypt.hash(data.password, 10);

    // 📱 Normalize phone (frontend sends e.g. "712 345 678")
    const rawPhone = data.phone.replace(/\s/g, ""); // remove spaces
    const fullPhone = "+254" + rawPhone;

    return await User.create({
        name: data.name,
        email: data.email,
        phone: fullPhone,
        password: hashed,

        // 🖼️ Profile image handling
        profileImage: file
            ? file.filename
            : (data.profileImage || ""),

        // 🔒 Force role
        role: "client"
    });
};


/**
 * Login user
 */
exports.loginUser = async (data) => {
    const user = await User.findOne({ email: data.email });

    if (!user) return null;

    const match = await bcrypt.compare(data.password, user.password);

    if (!match) return null;

    return user;
};


/**
 * Find user by email
 */
exports.findEmail = async (email) => {
    return await User.findOne({ email });
};


/**
 * Reset password
 */
exports.resetPassword = async (id, password) => {
    const hashed = await bcrypt.hash(password, 10);

    return await User.findByIdAndUpdate(id, {
        password: hashed
    });
};