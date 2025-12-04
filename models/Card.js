const mongoose = require("mongoose");
const { v4: uuidv4 } = require("uuid");

const CardSchema = new mongoose.Schema(
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
    card_name: {
      type: String,
      required: true,
      trim: true,
    },
    card_type: {
      type: String,
      enum: ["Credit", "Debit"],
      required: true,
    },
    last_four_digits: {
      type: String,
      required: true,
      minlength: 4,
      maxlength: 4,
    },
    bank_name: {
      type: String,
      trim: true,
    },
    balance: {
      type: Number, // Optional: for tracking debit card balance or credit limit
    },
    plaid_access_token: {
      type: String,
      select: false, // Hide by default for security
    },
    plaid_item_id: {
      type: String,
    },
    plaid_account_id: {
      type: String,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Card", CardSchema);
