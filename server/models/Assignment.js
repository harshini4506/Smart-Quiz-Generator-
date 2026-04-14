const mongoose = require("mongoose");

const assignmentSchema = new mongoose.Schema(
  {
    faculty_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    doc_id: { type: mongoose.Schema.Types.ObjectId, ref: "FileMeta", required: true, index: true },
    title: { type: String, required: true, trim: true },
    questions: { type: Array, default: [] },
    difficulty: { type: String, enum: ["easy", "medium", "hard"], default: "easy" },
    deadline: { type: Date, required: true, index: true },
    assigned_students: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  },
  { timestamps: { createdAt: "createdAt", updatedAt: "updatedAt" } }
);

module.exports = mongoose.model("Assignment", assignmentSchema);
