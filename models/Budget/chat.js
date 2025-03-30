const mongoose = require("mongoose");
const { v4: uuidv4 } = require("uuid");

const ChatSchema = new mongoose.Schema(
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
    query:{
        type: String
    },
    result: {
        type: Object
    },
   
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Chat", ChatSchema);
