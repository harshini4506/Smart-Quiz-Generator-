import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

import api from "../services/api";
import { useAppContext } from "../context/AppContext";

const countWords = (text) => String(text || "").trim().split(/\s+/).filter(Boolean).length;

const countReadableSentences = (text) =>
  String(text || "")
    .split(/[.!?]+/)
    .map((sentence) => sentence.trim())
    .filter((sentence) => sentence.length > 30).length;

const estimateQuestionCapacity = ({ text = "", keywords = [], chunkCount = 0, difficulty = "medium" } = {}) => {
  const words = countWords(text);
  const sentences = countReadableSentences(text);
  const keywordCount = Array.isArray(keywords) ? keywords.length : 0;

  let capacity = Math.floor(words / 55) + Math.floor(sentences / 3) + Math.floor(keywordCount / 3) + Math.floor(chunkCount / 2);

  if (difficulty === "hard") {
    capacity -= 2;
  } else if (difficulty === "easy") {
    capacity += 1;
  }

  return Math.max(3, capacity);
};

export default function QuizPage({ selectedDocId, setResultData }) {
  const [numQuestions, setNumQuestions] = useState(5);
  const [difficulty, setDifficulty] = useState("easy");
  const [quiz, setQuiz] = useState([]);
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [seconds, setSeconds] = useState(600);
  const [startedAt, setStartedAt] = useState(null);
  const [status, setStatus] = useState("");
  const [popupMessage, setPopupMessage] = useState("");
  const [docs, setDocs] = useState([]);
  const [currentDocId, setCurrentDocId] = useState(selectedDocId);
  const { dispatch } = useAppContext();
  const navigate = useNavigate();

  const selectedDoc = useMemo(
    () => docs.find((doc) => String(doc._id) === String(currentDocId)) || null,
    [docs, currentDocId]
  );
  const recommendedMax = useMemo(() => {
    if (!selectedDoc) return null;

    const persistedCapacity = Number(selectedDoc?.metadata?.question_capacity || 0);
    if (persistedCapacity > 0) return persistedCapacity;

    return estimateQuestionCapacity({
      text: selectedDoc?.text || "",
      keywords: selectedDoc?.keywords || [],
      chunkCount: Number(selectedDoc?.metadata?.chunk_count || 0),
      difficulty,
    });
  }, [selectedDoc, difficulty]);

  useEffect(() => {
    if (!recommendedMax) return;
    setNumQuestions((prev) => {
      const numeric = Number(prev || 0);
      if (!numeric) return prev;
      return String(Math.min(numeric, recommendedMax));
    });
  }, [recommendedMax]);

  useEffect(() => {
    const loadDocs = async () => {
      try {
        const { data } = await api.get("/history");
        setDocs(data.files || []);
      } catch (_err) {
        // Silent fail
      }
    };
    loadDocs();
    setCurrentDocId(selectedDocId);
  }, [selectedDocId]);

  useEffect(() => {
    if (!quiz.length) return;
    const t = setInterval(() => {
      setSeconds((s) => (s > 0 ? s - 1 : 0));
    }, 1000);
    return () => clearInterval(t);
  }, [quiz.length]);

  const mmss = useMemo(() => `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`, [seconds]);

  const handleDocChange = (docId) => {
    setCurrentDocId(docId);
    dispatch({ type: "SET_SELECTED_DOC", payload: docId });
  };

  const showPopup = (message) => {
    setPopupMessage(message);
  };

  const closePopup = () => {
    setPopupMessage("");
  };

  const generate = async () => {
    if (!currentDocId) {
      const message = "Please upload and select a document first.";
      setStatus(message);
      showPopup(message);
      return;
    }
    if (recommendedMax && Number(numQuestions) > recommendedMax) {
      const message = `This document only supports about ${recommendedMax} questions. Please request ${recommendedMax} or fewer questions, or upload a longer document.`;
      setStatus(message);
      showPopup(message);
      return;
    }
    setStatus("Generating quiz...");
    try {
      const { data } = await api.post("/generate-quiz", {
        doc_id: currentDocId,
        num_questions: Number(numQuestions),
        difficulty,
      });
      setQuiz(data.questions || []);
      setAnswers(new Array((data.questions || []).length).fill(""));
      setIndex(0);
      setSeconds(600);
      setStartedAt(Date.now() / 1000);
      setStatus("Quiz ready.");
    } catch (err) {
      const message = err?.response?.data?.error || "Failed to generate quiz";
      setStatus(message);
      showPopup(message);
    }
  };

  const submit = async () => {
    try {
      const { data } = await api.post("/submit-quiz", {
        doc_id: currentDocId,
        quiz,
        answers,
        started_at: startedAt,
      });
      setResultData(data);
      navigate("/results");
    } catch (err) {
      setStatus(err?.response?.data?.error || "Submit failed");
    }
  };

  const q = quiz[index];

  return (
    <div className="min-h-screen bg-white py-12">
      <div className="mx-auto max-w-4xl px-4">
        {popupMessage && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
            <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl border border-gray-200">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-wide text-red-600">Quiz generation warning</p>
                  <h2 className="mt-2 text-2xl font-bold text-gray-800">Not enough content</h2>
                </div>
                <button
                  type="button"
                  onClick={closePopup}
                  className="rounded-full px-3 py-1 text-2xl leading-none text-gray-500 hover:bg-gray-100 hover:text-gray-800"
                  aria-label="Close popup"
                >
                  ×
                </button>
              </div>
              <p className="mt-4 text-gray-700">{popupMessage}</p>
              <div className="mt-6 flex justify-end">
                <button
                  type="button"
                  onClick={closePopup}
                  className="rounded-xl bg-gray-900 px-5 py-3 font-semibold text-white hover:bg-gray-800 transition-colors"
                >
                  Okay
                </button>
              </div>
            </div>
          </div>
        )}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl shadow-2xl p-10 border border-gray-200"
        >
          {!quiz.length ? (
            <>
              <div className="text-center mb-8">
                <div className="text-6xl mb-4">📝</div>
                <h1 className="text-4xl font-bold text-gray-800 mb-2">Quiz Generator</h1>
                <p className="text-gray-600">Create a personalized quiz from your document</p>
                <div className="mt-4 flex justify-center gap-2">
                  <span className="text-3xl">⭐</span>
                  <span className="text-3xl">✨</span>
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-gray-700 font-semibold mb-3">📄 Select Document</label>
                  <select 
                    value={currentDocId} 
                    onChange={(e) => handleDocChange(e.target.value)} 
                    className="w-full rounded-xl border border-gray-300 bg-gray-50 p-4 text-gray-800 text-lg font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all cursor-pointer"
                  >
                    <option value="">Choose a document...</option>
                    {docs.map((doc) => (
                      <option key={doc._id} value={doc._id}>{doc.filename}</option>
                    ))}
                  </select>
                  {!currentDocId && <p className="text-sm text-red-600 mt-2">⚠️ Upload a document first</p>}
                </div>

                <div>
                  <label className="block text-gray-700 font-semibold mb-3">Number of Questions</label>
                  <input 
                    type="number" 
                    min={1} 
                    max={recommendedMax || undefined} 
                    value={numQuestions} 
                    onChange={(e) => setNumQuestions(e.target.value)} 
                    className="w-full rounded-xl border border-gray-300 bg-gray-50 p-4 text-gray-800 text-lg font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all" 
                  />
                  {recommendedMax && Number(numQuestions || 0) > recommendedMax && (
                    <p className="mt-2 text-sm text-red-600 font-semibold">
                      Warning: this upload is too short for {numQuestions} questions.
                    </p>
                  )}
                  <p className="mt-2 text-sm text-gray-500">
                    {selectedDoc
                      ? `Based on this upload, you can generate up to about ${recommendedMax} questions.`
                      : "Select a document to see the recommended question limit."}
                  </p>
                </div>

                <div>
                  <label className="block text-gray-700 font-semibold mb-3">Difficulty Level</label>
                  <select 
                    value={difficulty} 
                    onChange={(e) => setDifficulty(e.target.value)} 
                    className="w-full rounded-xl border border-gray-300 bg-gray-50 p-4 text-gray-800 text-lg font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all cursor-pointer"
                  >
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                  </select>
                </div>

                <motion.button 
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={generate} 
                  className="w-full rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-4 text-lg font-bold text-white hover:from-blue-600 hover:to-blue-700 transition-all shadow-lg"
                >
                  Generate Quiz »
                </motion.button>

                {status && (
                  <p className={`text-center p-4 rounded-lg font-semibold ${status.includes('Please') || status.includes('Failed') ? 'text-red-700 bg-red-50 border border-red-200' : 'text-blue-700 bg-blue-50 border border-blue-200'}`}>
                    {status}
                  </p>
                )}
              </div>
            </>
          ) : (
            <>
              <div className="mb-6 flex justify-between items-center">
                <h1 className="text-3xl font-bold text-gray-800">Quiz in Progress</h1>
                <div className="text-right">
                  <p className="text-sm text-gray-600">Time Remaining</p>
                  <p className="text-2xl font-bold text-gray-800">{mmss}</p>
                </div>
              </div>

              <div className="mb-6 bg-gray-50 rounded-lg p-4 border border-gray-200">
                <p className="text-sm text-gray-600">Question {index + 1} of {quiz.length}</p>
                <div className="w-full bg-gray-200 h-2 rounded-full mt-2">
                  <div 
                    className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full transition-all" 
                    style={{ width: `${((index + 1) / quiz.length) * 100}%` }}
                  />
                </div>
              </div>

              <div className="mb-8">
                <h2 className="text-2xl font-bold text-gray-800 mb-6">{q.question}</h2>
                {q.options?.length > 0 ? (
                  <div className="space-y-3">
                    {q.options.map((opt) => (
                      <label 
                        key={opt} 
                        className={`flex items-center p-4 rounded-xl border-2 cursor-pointer transition-all ${
                          answers[index] === opt 
                            ? 'border-blue-500 bg-blue-50 text-gray-800' 
                            : 'border-gray-300 bg-white text-gray-800 hover:border-blue-400'
                        }`}
                      >
                        <input
                          className="mr-4"
                          type="radio"
                          name={`q-${index}`}
                          checked={answers[index] === opt}
                          onChange={() => {
                            const next = [...answers];
                            next[index] = opt;
                            setAnswers(next);
                          }}
                        />
                        <span className="font-semibold">{opt}</span>
                      </label>
                    ))}
                  </div>
                ) : (
                  <input
                    className="w-full rounded-xl border border-gray-300 bg-gray-50 p-4 text-gray-800 text-lg placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all"
                    value={answers[index] || ""}
                    onChange={(e) => {
                      const next = [...answers];
                      next[index] = e.target.value;
                      setAnswers(next);
                    }}
                    placeholder="Type your answer here"
                  />
                )}
              </div>

              <div className="flex gap-3">
                <button 
                  disabled={index === 0} 
                  onClick={() => setIndex((i) => i - 1)} 
                  className="flex-1 rounded-xl border border-gray-300 bg-white px-6 py-3 font-bold text-gray-700 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-gray-50 transition-all"
                >
                  ← Previous
                </button>
                {index < quiz.length - 1 ? (
                  <button 
                    onClick={() => setIndex((i) => i + 1)} 
                    className="flex-1 rounded-xl bg-gray-900 px-6 py-3 font-bold text-white hover:bg-gray-800 transition-all"
                  >
                    Next →
                  </button>
                ) : (
                  <motion.button 
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={submit} 
                    className="flex-1 rounded-xl bg-green-600 px-6 py-3 font-bold text-white hover:bg-green-700 transition-all"
                  >
                    Submit Quiz ✓
                  </motion.button>
                )}
              </div>

              {status && (
                <p className="mt-4 text-center text-sm text-gray-600">{status}</p>
              )}
            </>
          )}
        </motion.div>
      </div>
    </div>
  );
}
