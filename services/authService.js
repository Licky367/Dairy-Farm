const User = require("../models/User");
const bcrypt = require("bcrypt");

/**
 * Create new user (CLIENT ONLY)
 * @param {Object} data - form data (name, email, phone, password, profileImage optional)
 * @param {Object} file - multer file (optional)
 */
exports.createUser = async (data, file = null) => {
    // Optional: block role injection attempts
    if (data.role) {
        throw new Error("Role assignment not allowed");
    }

    const hashed = await bcrypt.hash(data.password, 10);

    return await User.create({
        name: data.name,
        email: data.email,
        phone: data.phone,
        password: hashed,

        // ✅ Profile Image (matches schema field name)
        profileImage: file
            ? file.filename              // from multer upload
            : (data.profileImage || ""),// from form (URL or empty)

        // 🔒 FORCE ROLE
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