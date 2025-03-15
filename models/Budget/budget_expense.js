const mongoose = require("mongoose");
const { v4: uuidv4 } = require("uuid");

const BudgetExpenseSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      default: uuidv4,
      unique: true,
    },
    expense_id: {
      type: String,
      unique: true,
    },
    transaction_type: {
      type: String,
      enum: ["expense", "income"], // Differentiates between spending and receiving money
      required: true,
    },
    expense_type: {
      type: String,
    },
    expense_name: {
      type: String,
    },
    expense_date: {
      type: Date,
      default: Date.now, // Set default value to the current date and time
    },
    created_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    currency_code: {
      type: String,
      default: "USD",
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    payment_type: {
      type: String,
      enum: ["Cash", "Card", "UPI", "Other"],
      default: "Card",
    },
    group_name: {
      type: String,
      default: "general", // Default group for expenses if user does not specify one
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("BudgetExpense", BudgetExpenseSchema);
