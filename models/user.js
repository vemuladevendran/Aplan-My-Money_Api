const mongoose = require("mongoose");
const { v4: uuidv4 } = require("uuid");
const options = {
  timestamps: true,
};

const UserSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      default: uuidv4,
      unique: true,
    },
    user_id: {
      type: String,
      unique: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    phone_number: {
      type: String,
      trim: true,
    },
    default_currency: {
      type: String,
      default: "USD",
      trim: true,
    },
    timezone: {
      type: String,
      default: "UTC",
      trim: true,
    },
    groups: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Group",
      },
    ],
    total_amount_you_owed: {
      type: Number,
      default: 0,
    },
    total_amount_you_own: {
      type: Number,
      default: 0,
    },
    total_balance: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ["Registered", "Active", "Inactive"],
      default: "Registered",
      trim: true,
    },
    googleImg: {
      type: String,
      default: "",
    },
    loggedInDevices: [
      {
        platform: String,
        operatingSystem: String,
        deviceId: String,
      },
    ],
    notifications: [
      {
        message: String,
        created_at: Date,
        read: {
          type: Boolean,
          default: false,
        },
      },
    ],
    last_three_notifications: [
      {
        message: String,
        created_at: Date,
      },
    ],
    last_notification_read: {
      type: Date,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  options
);

module.exports = mongoose.model("User", UserSchema);
