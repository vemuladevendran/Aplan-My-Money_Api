const mongoose = require('mongoose')
const { v4: uuidv4 } = require("uuid");

const activityLogSchema = new mongoose.Schema(
    {
      id: {
        type: String,
        default: uuidv4,
        unique: true,
      },
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
      action: {
        type: String,
        required: true,
        enum: [
          'split_created', 
          'split_updated', 
          'settlement_added', 
          'settlement_updated', 
          'group_updated', 
          'value_updated',
          'expense_added',
          'expense_updated',
          'income_added',
          'income_updated',
          'expense_deleted',
          'income_deleted',
        ]
      },
      details: {
        type: String,
      },
    },
    { timestamps: true }
  );
  
  module.exports = mongoose.model("ActivityLog", activityLogSchema);