const mongoose = require("mongoose");
const { v4: uuidv4 } = require("uuid");

// balance split schema
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
// group members schema
const MemberSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  name: String,
  email: String,
  status: String,
  is_exist: {
    type: Boolean,
    default: true,
  },
  balance: Number,
});

// complete group schema
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
    members: [MemberSchema],
    original_debts: [DebtSchema],
    group_image: {
      type: String,
      trim: true,
    },
    cover_photo: {
      type: String,
      trim: true,
    },
    group_type: {
      type: String,
      enum: ["Home", "Office", "Friends", "Family", "Other"],
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
