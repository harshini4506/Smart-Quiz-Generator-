const mongoose = require("mongoose");

const fileMetaSchema = new mongoose.Schema(
  {
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    filename: { type: String, required: true },
    metadata: {
      size: Number,
      chunk_count: Number,
      path: String,
      question_capacity: Number,
    },
    text: { type: String, default: "" },
    keywords: [{ type: String }],
  },
  { timestamps: { createdAt: "createdAt", updatedAt: "updatedAt" } }
);

module.exports = mongoose.model("FileMeta", fileMetaSchema);
