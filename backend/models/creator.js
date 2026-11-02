
const mongoose = require("mongoose");

const creatorSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true
    },
    bio: {
      type: String,
      default: ""
    },
    skills: {
      type: [String],
      default: []
    },
    experience: {
      type: String,
      default: "Beginner"
    },
    portfolio: {
      type: [String],
      default: []
    },
    tools: {
      type: [String],
      default: []
    },
    hourlyRate: {
      type: Number,
      default: 0
    },
    availability: {
      type: String,
      enum: ["Available", "Busy", "Unavailable"],
      default: "Available"
    },
    verified: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("Creator", creatorSchema);
