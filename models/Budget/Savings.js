const mongoose = require("mongoose");
const { v4: uuidv4 } = require("uuid");

const SavingsSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      default: uuidv4,
      unique: true,
    },
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    target_amount: {
      type: Number,
      required: true,
    },
    current_amount: {
      type: Number,
      default: 0,
    },
    currency: {
      type: String,
      default: "USD",
    },
    target_date: {
      type: Date,
    },
    notes: {
      type: String,
      trim: true,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Savings", SavingsSchema);
