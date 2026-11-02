const express = require("express");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Brief = require("../models/Brief");
const Application = require("../models/Application");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

// ADMIN LOGIN
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password are required"
      });
    }

    const admin = await User.findOne({
      email: email.toLowerCase().trim(),
      role: "admin"
    });

    if (!admin || !(await admin.comparePassword(password))) {
      return res.status(401).json({
        message: "Invalid admin email or password"
      });
    }

    const token = jwt.sign(
      { id: admin._id, role: admin.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    return res.json({
      success: true,
      token,
      user: {
        id: admin._id,
        _id: admin._id,
        name: admin.name,
        email: admin.email,
        role: admin.role
      }
    });
  } catch (error) {
    console.error("Admin login error:", error);
    return res.status(500).json({
      message: "Server error during admin login"
    });
  }
});

// ADMIN AUTHENTICATION
router.use(authMiddleware);

router.use((req, res, next) => {
  if (req.user?.role !== "admin") {
    return res.status(403).json({
      message: "Admin access required"
    });
  }

  next();
});

// DASHBOARD STATISTICS
router.get("/stats", async (req, res) => {
  try {
    const [
      users,
      creators,
      brands,
      campaigns,
      applications
    ] = await Promise.all([
      User.countDocuments({
        role: { $in: ["creator", "brand"] }
      }),
      User.countDocuments({ role: "creator" }),
      User.countDocuments({ role: "brand" }),
      Brief.countDocuments(),
      Application.countDocuments()
    ]);

    res.json({
      success: true,
      stats: {
        users,
        creators,
        brands,
        campaigns,
        applications
      }
    });
  } catch (error) {
    console.error("Admin stats error:", error);
    res.status(500).json({
      message: "Could not load dashboard statistics"
    });
  }
});

// VIEW REGISTERED USERS
router.get("/users", async (req, res) => {
  try {
    const users = await User.find({
      role: { $in: ["creator", "brand"] }
    })
      .select("name email role createdAt")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      users
    });
  } catch (error) {
    console.error("Admin users error:", error);
    res.status(500).json({
      message: "Could not load users"
    });
  }
});

// VIEW ALL CAMPAIGNS
router.get("/campaigns", async (req, res) => {
  try {
    const briefs = await Brief.find()
      .populate("brand", "name email")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      briefs
    });
  } catch (error) {
    console.error("Admin campaigns error:", error);
    res.status(500).json({
      message: "Could not load campaigns"
    });
  }
});

// DELETE CAMPAIGN AND ITS APPLICATIONS
router.delete("/campaigns/:id", async (req, res) => {
  try {
    const brief = await Brief.findById(req.params.id);

    if (!brief) {
      return res.status(404).json({
        message: "Campaign not found"
      });
    }

    await Application.deleteMany({
      brief: brief._id
    });

    await brief.deleteOne();

    res.json({
      success: true,
      message: "Campaign and related applications deleted"
    });
  } catch (error) {
    console.error("Delete campaign error:", error);
    res.status(500).json({
      message: "Could not delete campaign"
    });
  }
});

// VIEW ALL APPLICATIONS
router.get("/applications", async (req, res) => {
  try {
    const applications = await Application.find()
      .populate("creator", "name email")
      .populate({
        path: "brief",
        select: "title category brand",
        populate: {
          path: "brand",
          select: "name email"
        }
      })
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      applications
    });
  } catch (error) {
    console.error("Admin applications error:", error);
    res.status(500).json({
      message: "Could not load applications"
    });
  }
});

module.exports = router;