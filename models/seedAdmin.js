const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("./User");
require("dotenv").config();

/*
=========================================
ADMIN SEED (3 ADMINS)
ENV-DRIVEN + SAFE RESEED
=========================================
*/

const admins = [
    {
        id: process.env.ADMIN_1_ID,
        name: process.env.ADMIN_1_NAME,
        email: process.env.ADMIN_1_EMAIL,
        phone: process.env.ADMIN_1_PHONE,
        password: process.env.ADMIN_1_PASSWORD
    },

    {
        id: process.env.ADMIN_2_ID,
        name: process.env.ADMIN_2_NAME,
        email: process.env.ADMIN_2_EMAIL,
        phone: process.env.ADMIN_2_PHONE,
        password: process.env.ADMIN_2_PASSWORD
    },

    {
        id: process.env.ADMIN_3_ID,
        name: process.env.ADMIN_3_NAME,
        email: process.env.ADMIN_3_EMAIL,
        phone: process.env.ADMIN_3_PHONE,
        password: process.env.ADMIN_3_PASSWORD
    }
];

const seedAdmins = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);

        console.log("MongoDB connected...");

        for (const admin of admins) {

            // skip incomplete entries
            if (!admin.email || !admin.password) {
                console.log(
                    `Skipping incomplete admin: ${admin.id}`
                );
                continue;
            }

            const exists = await User.findOne({
                email: admin.email
            });

            if (exists) {
                console.log(
                    `Admin already exists: ${admin.email}`
                );
                continue;
            }

            const hashedPassword =
                await bcrypt.hash(
                    admin.password,
                    10
                );

            await User.create({
                id: admin.id,
                name: admin.name,
                email: admin.email,
                phone: admin.phone,
                profileImage: "",
                password: hashedPassword,
                role: "admin"
            });

            console.log(
                `Created admin: ${admin.email}`
            );
        }

        console.log("All admins seeded successfully.");
        process.exit(0);

    } catch (error) {
        console.log("Seed error:", error);
        process.exit(1);
    }
};

seedAdmins();