
const express = require("express");
const Creator = require("../models/Creator");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/profile", authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== "creator") {
      return res.status(403).json({
        success: false,
        message: "Only creators can create profiles"
      });
    }

    const existingProfile = await Creator.findOne({
      user: req.user.id
    });

    if (existingProfile) {
      return res.status(409).json({
        success: false,
        message: "Creator profile already exists"
      });
    }

    const {
      bio,
      skills,
      experience,
      portfolio,
      tools,
      hourlyRate,
      availability
    } = req.body;

    const creator = await Creator.create({
      user: req.user.id,
      bio,
      skills,
      experience,
      portfolio,
      tools,
      hourlyRate,
      availability
    });

    res.status(201).json({
      success: true,
      message: "Creator profile created successfully",
      creator
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Unable to create creator profile"
    });
  }
});

router.get("/profile", authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== "creator") {
      return res.status(403).json({
        success: false,
        message: "Only creators can access this profile"
      });
    }

    const creator = await Creator.findOne({
      user: req.user.id
    }).populate("user", "name email");

    if (!creator) {
      return res.status(404).json({
        success: false,
        message: "Creator profile not found"
      });
    }

    res.json({
      success: true,
      creator
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Unable to fetch creator profile"
    });
  }
});

module.exports = router;
