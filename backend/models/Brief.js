
const mongoose = require("mongoose");

const briefSchema = new mongoose.Schema(
  {
    brand: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    title: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      required: true
    },
    category: {
      type: String,
      required: true
    },
    requiredSkills: {
      type: [String],
      default: []
    },
    budget: {
      type: Number,
      required: true
    },
    deadline: {
      type: Date
    },
    status: {
      type: String,
      enum: ["Open", "In Progress", "Completed", "Closed"],
      default: "Open"
    },
    recommendedCreators: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Creator"
      }
    ],
    selectedCreator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Creator",
      default: null
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("Brief", briefSchema);
