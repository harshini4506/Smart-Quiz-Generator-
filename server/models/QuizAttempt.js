const mongoose = require("mongoose");

const quizAttemptSchema = new mongoose.Schema(
  {
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    doc_id: { type: mongoose.Schema.Types.ObjectId, ref: "FileMeta", required: true, index: true },
    quiz: { type: Array, default: [] },
    answers: { type: Array, default: [] },
    score: { type: Number, required: true },
    correct: { type: Number, required: true },
    wrong: { type: Number, required: true },
    time_taken: { type: Number, required: true },
    mistake_topics: [{ type: String }],
  },
  { timestamps: { createdAt: "createdAt", updatedAt: "updatedAt" } }
);

module.exports = mongoose.model("QuizAttempt", quizAttemptSchema);
