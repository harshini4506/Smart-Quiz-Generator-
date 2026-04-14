import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

import api from "../services/api";

const isStrongPassword = (value) => {
  const password = String(value || "");
  return password.length >= 8 && /[A-Za-z]/.test(password) && /\d/.test(password);
};

export default function SignupPage({ onLogin }) {
  const [role, setRole] = useState("student");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    if (!isStrongPassword(password)) {
      setError("Password must be at least 8 characters and include letters and numbers.");
      return;
    }
    try {
      const { data } = await api.post("/auth/signup", { name, email, password, role });
      onLogin(data.token, data.user);
      navigate("/dashboard");
    } catch (err) {
      if (!err?.response) {
        setError("Cannot reach server. Start backend and try again.");
      } else {
        setError(err?.response?.data?.error || "Signup failed");
      }
    }
  };

  return (
    <div className="min-h-screen bg-white relative overflow-hidden flex items-center justify-center p-4">
      {/* Decorative educational icons */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Globe */}
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute top-16 left-1/4 text-gray-500 opacity-20"
        >
          <svg className="w-20 h-20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="10" strokeWidth="2"/>
            <path d="M2 12h20M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" strokeWidth="2"/>
          </svg>
        </motion.div>

        {/* Beaker */}
        <motion.div 
          animate={{ y: [0, -15, 0] }}
          transition={{ duration: 4, repeat: Infinity }}
          className="absolute top-1/3 right-20 text-gray-400 opacity-20"
        >
          <svg className="w-16 h-16" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M7 2a1 1 0 00-.707 1.707L7 4.414v3.758a1 1 0 01-.293.707l-4 4C.817 14.769 2.156 18 4.828 18h10.343c2.673 0 4.012-3.231 2.122-5.121l-4-4A1 1 0 0113 8.172V4.414l.707-.707A1 1 0 0013 2H7zm2 6.172V4h2v4.172a3 3 0 00.879 2.12l1.027 1.028a4 4 0 00-2.171.102l-.47.156a4 4 0 01-2.53 0l-.563-.187a1.993 1.993 0 00-.114-.035l1.063-1.063A3 3 0 009 8.172z" clipRule="evenodd" />
          </svg>
        </motion.div>

        {/* Calculator */}
        <motion.div 
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 3, repeat: Infinity }}
          className="absolute bottom-1/4 left-16 text-gray-400 opacity-20"
        >
          <svg className="w-14 h-14" fill="currentColor" viewBox="0 0 20 20">
            <path d="M6 2a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V4a2 2 0 00-2-2H6zm1 2h6a1 1 0 010 2H7a1 1 0 010-2zm6 7a1 1 0 011 1v3a1 1 0 11-2 0v-3a1 1 0 011-1zm-3 3a1 1 0 100 2h.01a1 1 0 100-2H10zm-4 1a1 1 0 011-1h.01a1 1 0 110 2H7a1 1 0 01-1-1zm1-4a1 1 0 100 2h.01a1 1 0 100-2H7zm2 1a1 1 0 011-1h.01a1 1 0 110 2H10a1 1 0 01-1-1zm4-4a1 1 0 100 2h.01a1 1 0 100-2H13zM9 9a1 1 0 011-1h.01a1 1 0 110 2H10a1 1 0 01-1-1zM7 8a1 1 0 000 2h.01a1 1 0 000-2H7z" />
          </svg>
        </motion.div>

        {/* Certificate */}
        <motion.div 
          animate={{ rotate: [-3, 3, -3] }}
          transition={{ duration: 4, repeat: Infinity }}
          className="absolute bottom-1/3 right-1/4 text-gray-500 opacity-20"
        >
          <svg className="w-18 h-18" fill="currentColor" viewBox="0 0 20 20">
            <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
            <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
          </svg>
        </motion.div>

        {/* Star decorations */}
        <div className="absolute top-20 right-10 text-gray-300 opacity-30">⭐</div>
        <div className="absolute top-2/3 left-10 text-gray-300 opacity-30">✨</div>
        <div className="absolute bottom-20 right-1/3 text-gray-300 opacity-30">⭐</div>
      </div>

      {/* Main signup card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 w-full max-w-md"
      >
        <div className="bg-white rounded-3xl shadow-2xl p-8 border border-gray-200">
          {/* Header */}
          <div className="text-center mb-8">
            <motion.h1 
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              className="text-5xl font-bold text-gray-800 mb-2"
            >
              JOIN US
            </motion.h1>
            <p className="text-gray-600 text-lg">Start Your Learning Journey</p>
          </div>

          <form onSubmit={submit} className="space-y-5">
            <div>
              <label className="block text-gray-700 text-sm font-bold mb-2">Create Account As</label>
              <select
                className="w-full rounded-xl border border-gray-300 bg-gray-50 p-4 text-gray-800 focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all"
                value={role}
                onChange={(e) => setRole(e.target.value)}
              >
                <option value="student">User</option>
                <option value="faculty">Faculty</option>
              </select>
            </div>

            <div>
              <label className="block text-gray-700 text-sm font-bold mb-2">Full Name</label>
              <input 
                className="w-full rounded-xl border border-gray-300 bg-gray-50 p-4 text-gray-800 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all" 
                placeholder="Enter your name" 
                value={name} 
                onChange={(e) => setName(e.target.value)} 
                required 
              />
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
                minLength={8}
                required 
              />
              <p className="mt-2 text-xs text-gray-500">Use at least 8 characters with letters and numbers.</p>
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
              Sign Up »
            </motion.button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-600">
              Already have an account?{" "}
              <Link 
                className="font-bold text-blue-500 hover:text-blue-600 transition-colors underline" 
                to="/login"
              >
                Login
              </Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
