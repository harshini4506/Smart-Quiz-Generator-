const FileMeta = require("../models/FileMeta");
const QuizAttempt = require("../models/QuizAttempt");
const { toPlain } = require("../utils/serialize");

const getHistory = async (user) => {
  const files = await FileMeta.find({ user_id: user._id }).sort({ createdAt: -1 }).lean();
  const quizzes = await QuizAttempt.find({ user_id: user._id }).sort({ createdAt: -1 }).lean();

  const progress = quizzes.map((q) => ({ date: String(q.createdAt), score: q.score }));

  const leaderboardAgg = await QuizAttempt.aggregate([
    { $group: { _id: "$user_id", avgScore: { $avg: "$score" }, attempts: { $sum: 1 } } },
    { $sort: { avgScore: -1 } },
    { $limit: 10 },
  ]);

  const leaderboard = leaderboardAgg.map((item) => ({
    user_id: String(item._id),
    avgScore: Number(item.avgScore.toFixed(2)),
    attempts: item.attempts,
  }));

  return [
    {
      files: files.map(toPlain),
      quizzes: quizzes.map(toPlain),
      progress,
      leaderboard,
    },
    200,
  ];
};

module.exports = { getHistory };
