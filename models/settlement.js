const mongoose = require("mongoose");
const { v4: uuidv4 } = require("uuid");

const settlementSchema = new mongoose.Schema(
    {
      id: {
        type: String,
        default: uuidv4,
        unique: true,
      },
      groupId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Group",
        required: true,
      },
      settledBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
      settledWith: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
      amount: {
        type: Number,
        required: [true, "Amount is required"],
      },
      description: {
        type: String,
        required: [true, "Description is required"],
      },
      isDeleted: {
        type: Boolean,
        default: false
      }
    },
    { timestamps: true }
  );
  
  module.exports = mongoose.model("Settlement", settlementSchema);
  