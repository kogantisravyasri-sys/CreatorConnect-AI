const express = require("express");
const router = express.Router();
const Brief = require("../models/Brief");
const authMiddleware = require("../middleware/authMiddleware");

router.post("/", authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== "brand") {
      return res.status(403).json({
        success: false,
        message: "Only brands can create briefs"
      });
    }

    const { title, description, category, requiredSkills, budget, deadline } = req.body;

    if (!title || !description || !category || !budget) {
      return res.status(400).json({
        success: false,
        message: "Please fill all required fields"
      });
    }

    const brief = await Brief.create({
      brand: req.user.id,
      title,
      description,
      category,
      requiredSkills: requiredSkills || [],
      budget,
      deadline
    });

    res.status(201).json({
      success: true,
      message: "Brief created successfully",
      brief
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

router.get("/", async (req, res) => {
  try {
    const briefs = await Brief.find({ status: "Open" })
      .populate("brand", "name");

    res.status(200).json({
      success: true,
      count: briefs.length,
      briefs
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router;