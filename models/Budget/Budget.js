const mongoose = require("mongoose");
const { v4: uuidv4 } = require("uuid");

const BudgetSchema = new mongoose.Schema(
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
    amount: {
      type: Number,
      required: true,
    },
    currency: {
      type: String,
      default: "USD",
    },
    period: {
      type: String,
      enum: ["monthly", "yearly", "weekly"],
      default: "monthly",
    },
    category: {
      type: String, // Optional: if budget is specific to a category
      default: "all",
    },
    alert_threshold: {
      type: Number, // Percentage, e.g., 80 for 80%
      default: 100,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Budget", BudgetSchema);
