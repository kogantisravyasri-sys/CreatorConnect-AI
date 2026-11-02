
require("dotenv").config();

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("./models/User");

async function resetAdminPassword() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);

        console.log("MongoDB connected");

        const admin = await User.findOne({
            email: "admin@creatorconnect.ai",
            role: "admin"
        });

        if (!admin) {
            console.log("Admin account not found");
            return;
        }

        const newPassword = "Admin@12345";

        // Assign plain-text password.
        // User model automatically hashes it before saving.
        admin.password = newPassword;

        await admin.save();

        console.log("Admin password reset successfully!");
        console.log("Email: admin@creatorconnect.ai");
        console.log("Temporary password: Admin@12345");

    } catch (error) {
        console.error("Error:", error.message);
    } finally {
        await mongoose.disconnect();
    }
}

resetAdminPassword();
