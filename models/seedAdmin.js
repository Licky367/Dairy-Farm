const bcrypt = require("bcryptjs");
const User = require("./User");

/*
=========================================
ADMIN SEED
HARDCODED ADMINS
SAFE RESEED
=========================================
*/

const admins = [
  {
    id: "ADM001",
    name: "System Admin",
    email: "admin1@example.com",
    phone: "0700000001",
    password: "admin123"
  },

  {
    id: "ADM002",
    name: "Finance Admin",
    email: "admin2@example.com",
    phone: "0700000002",
    password: "admin123"
  },

  {
    id: "ADM003",
    name: "Operations Admin",
    email: "admin3@example.com",
    phone: "0700000003",
    password: "admin123"
  }
];

const seedAdmins = async () => {

  try {

    for (const admin of admins) {

      const exists = await User.findOne({
        email: admin.email
      });

      if (exists) {

        console.log(
          `⚠️ Admin already exists: ${admin.email}`
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
        `✅ Created admin: ${admin.email}`
      );
    }

    console.log(
      "🎉 Admin seeding completed successfully."
    );

  } catch (error) {

    console.log(
      "🔴 Seed Error:",
      error
    );

  }

};

module.exports = seedAdmins;