import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

import api from "../services/api";

export default function LoginPage({ onLogin }) {
  const [accountType, setAccountType] = useState("auto");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const payload = { email, password };
      if (accountType !== "auto") {
        payload.role = accountType;
      }
      const { data } = await api.post("/auth/login", payload);
      onLogin(data.token, data.user);
      navigate("/dashboard");
    } catch (err) {
      if (!err?.response) {
        setError("Cannot reach server. Start backend and try again.");
      } else {
        setError(err?.response?.data?.error || "Login failed");
      }
    }
  };

  return (
    <div className="min-h-screen bg-white relative overflow-hidden flex items-center justify-center p-4">
      {/* Decorative educational icons */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Lightbulb */}
        <motion.div 
          animate={{ y: [0, -20, 0] }}
          transition={{ duration: 4, repeat: Infinity }}
          className="absolute top-20 left-10 text-gray-400 opacity-20"
        >
          <svg className="w-16 h-16" fill="currentColor" viewBox="0 0 20 20">
            <path d="M11 3a1 1 0 10-2 0v1a1 1 0 102 0V3zM15.657 5.757a1 1 0 00-1.414-1.414l-.707.707a1 1 0 001.414 1.414l.707-.707zM18 10a1 1 0 01-1 1h-1a1 1 0 110-2h1a1 1 0 011 1zM5.05 6.464A1 1 0 106.464 5.05l-.707-.707a1 1 0 00-1.414 1.414l.707.707zM5 10a1 1 0 01-1 1H3a1 1 0 110-2h1a1 1 0 011 1zM8 16v-1h4v1a2 2 0 11-4 0zM12 14c.015-.34.208-.646.477-.859a4 4 0 10-4.954 0c.27.213.462.519.476.859h4.002z" />
          </svg>
        </motion.div>

        {/* Atom */}
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute top-32 right-16 text-gray-500 opacity-20"
        >
          <svg className="w-20 h-20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="1" fill="currentColor"/>
            <ellipse cx="12" cy="12" rx="8" ry="3" strokeWidth="2"/>
            <ellipse cx="12" cy="12" rx="3" ry="8" strokeWidth="2"/>
          </svg>
        </motion.div>

        {/* Question mark */}
        <motion.div 
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 3, repeat: Infinity }}
          className="absolute top-1/4 left-1/4 text-gray-600 opacity-20"
        >
          <svg className="w-12 h-12" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
          </svg>
        </motion.div>

        {/* Pencil */}
        <motion.div 
          animate={{ rotate: [-5, 5, -5] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="absolute bottom-32 right-1/4 text-gray-400 opacity-20"
        >
          <svg className="w-14 h-14" fill="currentColor" viewBox="0 0 20 20">
            <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
          </svg>
        </motion.div>

        {/* Book */}
        <motion.div 
          animate={{ y: [0, 15, 0] }}
          transition={{ duration: 5, repeat: Infinity }}
          className="absolute bottom-20 left-16 text-gray-500 opacity-20"
        >
          <svg className="w-16 h-16" fill="currentColor" viewBox="0 0 20 20">
            <path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z" />
          </svg>
        </motion.div>

        {/* Star decorations */}
        <div className="absolute top-10 right-1/3 text-gray-300 opacity-30">⭐</div>
        <div className="absolute top-1/3 right-10 text-gray-300 opacity-30">✨</div>
        <div className="absolute bottom-1/3 left-20 text-gray-300 opacity-30">⭐</div>
      </div>

      {/* Main login card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 w-full max-w-md"
      >
        <div className="bg-white rounded-3xl shadow-2xl p-5 sm:p-8 border border-gray-200">
          {/* Header */}
          <div className="text-center mb-8">
            <motion.h1 
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              className="text-4xl sm:text-5xl font-bold text-gray-800 mb-2"
            >
              WELCOME
            </motion.h1>
            <p className="text-gray-600 text-base sm:text-lg">Make Your Own Quiz</p>
          </div>

          <form onSubmit={submit} className="space-y-5">
            <div>
              <label className="block text-gray-700 text-sm font-bold mb-2">Account Type</label>
              <select
                className="w-full rounded-xl border border-gray-300 bg-gray-50 p-4 text-gray-800 focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all"
                value={accountType}
                onChange={(e) => setAccountType(e.target.value)}
              >
                <option value="auto">Auto Detect</option>
                <option value="student">Student</option>
                <option value="faculty">Faculty</option>
              </select>
            </div>

            <div>
              <label className="block text-gray-700 text-sm font-bold mb-2">Email</label>
              <input 
                className="w-full rounded-xl border border-gray-300 bg-gray-50 p-4 text-gray-800 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all" 
                placeholder="Enter your email" 
                type="email" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                required 
              />
            </div>

            <div>
              <label className="block text-gray-700 text-sm font-bold mb-2">Password</label>
              <input 
                className="w-full rounded-xl border border-gray-300 bg-gray-50 p-4 text-gray-800 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all" 
                placeholder="Enter your password" 
                type="password" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                required 
              />
            </div>

            {error && (
              <motion.p 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-sm text-red-800 bg-red-50 border border-red-200 p-3 rounded-lg font-semibold"
              >
                {error}
              </motion.p>
            )}

            <motion.button 
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-4 font-bold text-white shadow-lg hover:from-blue-600 hover:to-blue-700 transition-all text-lg"
            >
              Login »
            </motion.button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-600">
              Don't have an account?{" "}
              <Link 
                className="font-bold text-blue-500 hover:text-blue-600 transition-colors underline" 
                to="/signup"
              >
                Sign Up
              </Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
