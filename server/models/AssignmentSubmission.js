const mongoose = require("mongoose");

const assignmentSubmissionSchema = new mongoose.Schema(
  {
    assignment_id: { type: mongoose.Schema.Types.ObjectId, ref: "Assignment", required: true, index: true },
    student_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    answers: { type: Array, default: [] },
    submitted_at: { type: Date, default: Date.now },
    marks: { type: Number, default: null },
    feedback: { type: String, default: "" },
    graded_by: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    graded_at: { type: Date, default: null },
  },
  { timestamps: { createdAt: "createdAt", updatedAt: "updatedAt" } }
);

assignmentSubmissionSchema.index({ assignment_id: 1, student_id: 1 }, { unique: true });

module.exports = mongoose.model("AssignmentSubmission", assignmentSubmissionSchema);
