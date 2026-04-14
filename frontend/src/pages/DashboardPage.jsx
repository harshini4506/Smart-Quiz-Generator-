import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import StatefulSessionCard from "../components/StatefulSessionCard";

const facultyCards = [
  { title: "Upload Study Material", to: "/upload", icon: "📚", desc: "Upload source documents for quiz creation" },
  { title: "Generate And Assign Quiz", to: "/faculty/assignments", icon: "🧑‍🏫", desc: "Generate quiz questions and assign them to selected students" },
  { title: "History", to: "/history", icon: "📊", desc: "View uploaded files and activity" },
];

const studentCards = [
  { title: "Upload Study Material", to: "/upload", icon: "📚", desc: "Upload documents to generate quizzes" },
  { title: "Assigned Quizzes", to: "/student/assignments", icon: "📝", desc: "Attempt assigned quizzes before deadline" },
  { title: "Document Summary", to: "/summary", icon: "📄", desc: "Get AI-powered summaries" },
  { title: "Ask Questions", to: "/chatbot", icon: "💬", desc: "Chat with your documents" },
  { title: "Practice Quiz", to: "/quiz", icon: "🎯", desc: "Generate your own practice quiz" },
  { title: "History", to: "/history", icon: "📊", desc: "View quiz history and progress" },
];

export default function DashboardPage({ user }) {
  const cards = user?.role === "faculty" ? facultyCards : studentCards;

  return (
    <div className="min-h-screen bg-white">
      <div className="mx-auto max-w-6xl px-4 py-12">
        <div className="text-center mb-12">
          <motion.h1 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-5xl font-bold text-gray-800 mb-3"
          >
            Welcome, {user?.name || "Learner"}
          </motion.h1>
          <p className="text-xl text-gray-600">What would you like to do today?</p>
          <div className="mt-4 flex justify-center gap-2">
            <span className="text-4xl">⭐</span>
            <span className="text-4xl">✨</span>
            <span className="text-4xl">⭐</span>
          </div>
        </div>

        <div className="mb-8">
          <StatefulSessionCard userName={user?.name} />
        </div>
        
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {cards.map((card, idx) => (
            <motion.div
              key={card.to}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
            >
              <Link to={card.to} className="block">
                <div className="bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all p-8 border border-gray-200 hover:border-gray-300 h-full hover:bg-gray-50">
                  <div className="text-5xl mb-4">{card.icon}</div>
                  <h2 className="text-2xl font-bold text-gray-800 mb-2">{card.title}</h2>
                  <p className="text-gray-600">{card.desc}</p>
                  <button className="mt-4 inline-block px-6 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg font-semibold hover:from-blue-600 hover:to-blue-700 transition-all shadow-md">
                    Open →
                  </button>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
