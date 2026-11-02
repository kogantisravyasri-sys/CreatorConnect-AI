
const express = require("express");
const router = express.Router();

const Message = require("../models/Message");
const Application = require("../models/Application");
const authMiddleware = require("../middleware/authMiddleware");

// Check whether the logged-in user belongs to this accepted application.
async function getAuthorizedApplication(applicationId, user) {
  const application = await Application.findById(applicationId).populate({
    path: "brief",
    select: "brand title"
  });

  if (!application || !application.brief) {
    return {
      error: "Application not found",
      status: 404
    };
  }

  if (application.status !== "Accepted") {
    return {
      error: "Messaging is available only after an application is accepted",
      status: 403
    };
  }

  const isCreator =
    String(application.creator) === String(user.id);

  const isBrand =
    String(application.brief.brand) === String(user.id);

  if (!isCreator && !isBrand) {
    return {
      error: "You are not allowed to access this conversation",
      status: 403
    };
  }

  return { application };
}

// GET CONVERSATION MESSAGES
router.get("/:applicationId", authMiddleware, async (req, res) => {
  try {
    const result = await getAuthorizedApplication(
      req.params.applicationId,
      req.user
    );

    if (result.error) {
      return res.status(result.status).json({
        success: false,
        message: result.error
      });
    }

    const messages = await Message.find({
      application: result.application._id
    })
      .populate("sender", "name role")
      .sort({ createdAt: 1 });

    return res.json({
      success: true,
      messages
    });

  } catch (error) {
    console.error("Load messages error:", error);

    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// SEND A MESSAGE
router.post("/:applicationId", authMiddleware, async (req, res) => {
  try {
    const result = await getAuthorizedApplication(
      req.params.applicationId,
      req.user
    );

    if (result.error) {
      return res.status(result.status).json({
        success: false,
        message: result.error
      });
    }

    const text =
      typeof req.body.text === "string"
        ? req.body.text.trim()
        : "";

    if (!text) {
      return res.status(400).json({
        success: false,
        message: "Please enter a message"
      });
    }

    if (text.length > 2000) {
      return res.status(400).json({
        success: false,
        message: "Message must be 2000 characters or fewer"
      });
    }

    const message = await Message.create({
      application: result.application._id,
      sender: req.user.id,
      text
    });

    await message.populate("sender", "name role");

    return res.status(201).json({
      success: true,
      message: "Message sent successfully",
      savedMessage: message
    });

  } catch (error) {
    console.error("Send message error:", error);

    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router;
