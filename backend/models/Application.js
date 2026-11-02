const mongoose = require("mongoose");

const applicationSchema = new mongoose.Schema({
    brief: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Brief",
        required: true
    },
    creator: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    proposal: {
        type: String,
        required: true,
        trim: true
    },
    portfolio: {
        type: String,
        default: ""
    },
    status: {
        type: String,
        enum: ["Pending", "Accepted", "Rejected"],
        default: "Pending"
    }
}, { timestamps: true });

applicationSchema.index(
    { brief: 1, creator: 1 },
    { unique: true }
);

module.exports = mongoose.model("Application", applicationSchema);