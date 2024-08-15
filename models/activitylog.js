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
        ttype: String,
        required: true,
        enum: [
          'split_created', 
          'split_updated', 
          'settlement_added', 
          'settlement_updated', 
          'group_updated', 
          'value_updated'
        ]
      },
      details: {
        type: String,
      },
    },
    { timestamps: true }
  );
  
  module.exports = mongoose.model("ActivityLog", activityLogSchema);