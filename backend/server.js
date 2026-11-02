
require("dotenv").config();

const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");

const authRoutes = require("./routes/authRoutes");
const adminRoutes = require("./routes/adminRoutes");
const briefRoutes = require("./routes/briefRoutes");
const creatorRoutes = require("./routes/creatorRoutes");
const applicationRoutes = require("./routes/applicationRoutes");
const messageRoutes = require("./routes/MessageRoutes");
const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
    res.send("CreatorConnect AI Backend is Running!");
});

app.get("/api/health", (req, res) => {
    res.json({
        success: true,
        message: "Backend is working successfully!"
    });
});

app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/briefs", briefRoutes);
app.use("/api/creators", creatorRoutes);
app.use("/api/applications", applicationRoutes);
app.use("/api/messages", messageRoutes);

mongoose.connect(process.env.MONGODB_URI)
    .then(() => {
        console.log("MongoDB Connected Successfully");

        const PORT = process.env.PORT || 5000;

        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });
    })
    .catch((error) => {
        console.error("MongoDB Connection Failed:", error.message);
    });
