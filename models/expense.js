const mongoose = require("mongoose");
const { v4: uuidv4 } = require("uuid");

const ExpenseSchema = new mongoose.Schema(
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

    group_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Group",
      required: true,
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
    split_type: {
      type: String,
      enum: ["equal", "unequal", "percentage"],
      required: true,
    },
    splits: [
      {
        user_id: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        amount: Number,
      },
    ],
    isDeleted: {
        type: Boolean,
        default: false
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Expense", ExpenseSchema);
