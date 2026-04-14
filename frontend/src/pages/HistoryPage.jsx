import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";

import api from "../services/api";

export default function HistoryPage() {
  const [data, setData] = useState({ files: [], quizzes: [], progress: [], leaderboard: [] });
  const [status, setStatus] = useState("Loading...");

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await api.get("/history");
        setData(data);
        setStatus("");
      } catch {
        setStatus("Failed to load history");
      }
    };
    load();
  }, []);

  return (
    <div className="min-h-screen bg-white py-12">
      <div className="mx-auto max-w-6xl px-4">
        <div className="text-center mb-12">
          <div className="text-6xl mb-4">📊</div>
          <h1 className="text-4xl font-bold text-gray-800 mb-2">Your Learning History</h1>
          <p className="text-xl text-gray-600">Track your progress and achievements</p>
          <div className="mt-4 flex justify-center gap-2">
            <span className="text-3xl">⭐</span>
            <span className="text-3xl">✨</span>
            <span className="text-3xl">⭐</span>
          </div>
        </div>

        {status && <p className="text-center mb-6 text-gray-600">{status}</p>}
        
        <div className="grid gap-6 md:grid-cols-2">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0 }}
            className="bg-white rounded-2xl shadow-lg p-6 border-2 border-gray-200"
          >
            <div className="flex items-center gap-3 mb-4">
              <span className="text-3xl">📚</span>
              <h2 className="text-2xl font-bold text-gray-900">Uploaded Documents</h2>
            </div>
            <ul className="space-y-2">
              {data.files.length === 0 ? (
                <li className="text-gray-500 italic">No documents yet</li>
              ) : (
                data.files.map((f) => (
                  <li key={f._id} className="bg-gray-50 rounded-lg p-3 text-gray-700 font-semibold">
                    {f.filename}
                  </li>
                ))
              )}
            </ul>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-2xl shadow-lg p-6 border-2 border-gray-200"
          >
            <div className="flex items-center gap-3 mb-4">
              <span className="text-3xl">📈</span>
              <h2 className="text-2xl font-bold text-gray-900">Progress Tracking</h2>
            </div>
            <ul className="space-y-2">
              {data.progress.length === 0 ? (
                <li className="text-gray-500 italic">No progress data yet</li>
              ) : (
                data.progress.map((p, i) => (
                  <li key={i} className="bg-gray-50 rounded-lg p-3 text-gray-700 font-semibold flex justify-between">
                    <span>{p.date}</span>
                    <span className="text-green-600">{p.score}%</span>
                  </li>
                ))
              )}
            </ul>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-2xl shadow-lg p-6 border-2 border-gray-200"
          >
            <div className="flex items-center gap-3 mb-4">
              <span className="text-3xl">✅</span>
              <h2 className="text-2xl font-bold text-gray-900">Quiz Attempts</h2>
            </div>
            <ul className="space-y-2">
              {data.quizzes.length === 0 ? (
                <li className="text-gray-500 italic">No quizzes taken yet</li>
              ) : (
                data.quizzes.map((q) => (
                  <li key={q._id} className="bg-gray-50 rounded-lg p-3 text-gray-700 font-semibold flex justify-between">
                    <span>Score: {q.score}%</span>
                    <span className="text-gray-500">{q.time_taken}s</span>
                  </li>
                ))
              )}
            </ul>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-2xl shadow-lg p-6 border-2 border-gray-200"
          >
            <div className="flex items-center gap-3 mb-4">
              <span className="text-3xl">🏆</span>
              <h2 className="text-2xl font-bold text-gray-900">Leaderboard</h2>
            </div>
            <ul className="space-y-2">
              {data.leaderboard.length === 0 ? (
                <li className="text-gray-500 italic">No leaderboard data yet</li>
              ) : (
                data.leaderboard.map((l, i) => (
                  <li key={l.user_id} className="bg-gray-50 rounded-lg p-3 text-gray-700 font-semibold flex justify-between">
                    <span>#{i + 1}</span>
                    <span>Avg: {l.avgScore}%</span>
                    <span className="text-gray-500">({l.attempts} attempts)</span>
                  </li>
                ))
              )}
            </ul>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
