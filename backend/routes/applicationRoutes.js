
const express = require("express");
const router = express.Router();

const Application = require("../models/Application");
const Brief = require("../models/Brief");
const authMiddleware = require("../middleware/authMiddleware");

// CREATOR APPLIES FOR A CAMPAIGN
router.post("/:briefId", authMiddleware, async (req, res) => {
    try {
        if (req.user.role !== "creator") {
            return res.status(403).json({
                success: false,
                message: "Only creators can apply"
            });
        }

        const { proposal, portfolio } = req.body;

        if (!proposal || !proposal.trim()) {
            return res.status(400).json({
                success: false,
                message: "Please enter your proposal"
            });
        }

        const brief = await Brief.findById(req.params.briefId);

        if (!brief || brief.status !== "Open") {
            return res.status(404).json({
                success: false,
                message: "Campaign is not available"
            });
        }

        const existing = await Application.findOne({
            brief: brief._id,
            creator: req.user.id
        });

        if (existing) {
            return res.status(409).json({
                success: false,
                message: "You have already applied"
            });
        }

        const application = await Application.create({
            brief: brief._id,
            creator: req.user.id,
            proposal: proposal.trim(),
            portfolio: portfolio || ""
        });

        return res.status(201).json({
            success: true,
            message: "Application submitted successfully",
            application
        });

    } catch (error) {
        console.error("Application error:", error);

        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
});


// CREATOR VIEWS THEIR APPLICATIONS
router.get("/creator/my", authMiddleware, async (req, res) => {
    try {
        if (req.user.role !== "creator") {
            return res.status(403).json({
                success: false,
                message: "Creator access only"
            });
        }

        const applications = await Application.find({
            creator: req.user.id
        })
        .populate({
            path: "brief",
            select: "title category budget status brand",
            populate: {
                path: "brand",
                select: "name email"
            }
        })
        .sort({ createdAt: -1 });

        const safeApplications = applications.map(application => {
            const item = application.toObject();

            if (
                item.status !== "Accepted" &&
                item.brief &&
                item.brief.brand
            ) {
                item.brief.brand.email = null;
            }

            return item;
        });

        return res.json({
            success: true,
            applications: safeApplications
        });

    } catch (error) {
        console.error("Creator applications error:", error);

        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
});


// BRAND VIEWS APPLICATIONS FOR THEIR CAMPAIGNS
router.get("/brand/my", authMiddleware, async (req, res) => {
    try {
        if (req.user.role !== "brand") {
            return res.status(403).json({
                success: false,
                message: "Brand access only"
            });
        }

        const briefs = await Brief.find({
            brand: req.user.id
        }).select("_id");

        const briefIds = briefs.map(brief => brief._id);

        const applications = await Application.find({
            brief: { $in: briefIds }
        })
        .populate("creator", "name email")
        .populate("brief", "title category budget")
        .sort({ createdAt: -1 });

        const safeApplications = applications.map(application => {
            const item = application.toObject();

            if (
                item.status !== "Accepted" &&
                item.creator
            ) {
                item.creator.email = null;
            }

            return item;
        });

        return res.json({
            success: true,
            applications: safeApplications
        });

    } catch (error) {
        console.error("Brand applications error:", error);

        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
});


// BRAND ACCEPTS OR REJECTS APPLICATIONS
router.patch("/:applicationId/status", authMiddleware, async (req, res) => {
    try {
        if (req.user.role !== "brand") {
            return res.status(403).json({
                success: false,
                message: "Only brands can update applications"
            });
        }

        const { status } = req.body;

        if (!["Accepted", "Rejected"].includes(status)) {
            return res.status(400).json({
                success: false,
                message: "Invalid application status"
            });
        }

        const application = await Application.findById(
            req.params.applicationId
        ).populate("brief");

        if (!application || !application.brief) {
            return res.status(404).json({
                success: false,
                message: "Application not found"
            });
        }

        if (
            String(application.brief.brand) !==
            String(req.user.id)
        ) {
            return res.status(403).json({
                success: false,
                message: "You cannot manage this application"
            });
        }

        application.status = status;
        await application.save();

        return res.json({
            success: true,
            message: `Application ${status.toLowerCase()} successfully`,
            application
        });

    } catch (error) {
        console.error("Application status error:", error);

        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

module.exports = router;
