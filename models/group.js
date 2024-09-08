const mongoose = require("mongoose");
const { v4: uuidv4 } = require("uuid");

// Balance split schema
const DebtSchema = new mongoose.Schema({
  currency_code: String,
  from_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  to_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  amount: Number,
});

// Group members schema
const MemberSchema = new mongoose.Schema({
  id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User", // Reference to User model
  },
  user_id: {
    type: String, // A unique string identifier (like a username or external ID)
    required: true, // Ensure user_id is always provided
  },
  name: {
    type: String,
    required: true, // Ensure name is provided
    trim: true,
  },
  email: {
    type: String,
    required: true, // Ensure email is provided
    trim: true,
  },
  status: {
    type: String,
    enum: ["active", "inactive", "pending"], // Example statuses; modify as needed
    default: "active",
  },
  is_exist: {
    type: Boolean,
    default: true,
  },
  balance: {
    type: Number,
    default: 0, // Default balance to 0
  },
});

// Complete group schema
const GroupSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      default: uuidv4,
      unique: true,
    },
    group_id: {
      type: String,
      unique: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    members: [MemberSchema], // Array of members
    original_debts: [DebtSchema], // Array of debts
    group_image: {
      type: String,
      trim: true,
    },
    group_default_image: String,
    cover_photo: {
      type: String,
      trim: true,
    },
    group_type: {
      type: String,
      default: "Other",
      trim: true,
    },
    created_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    group_reminders: [
      {
        reminder_message: String,
        reminder_time: Date,
      },
    ],
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Group", GroupSchema);
