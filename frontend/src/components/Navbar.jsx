import React from "react";
import { Link, useNavigate } from "react-router-dom";

export default function Navbar({ user, onLogout }) {
  const navigate = useNavigate();

  return (
    <header className="bg-white border-b border-gray-200 shadow-lg sticky top-0 z-50">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <button 
          onClick={() => navigate("/dashboard")} 
          className="text-xl font-bold text-gray-800 hover:text-blue-600 transition-colors flex items-center gap-2"
        >
          <span className="text-2xl">📚</span>
          <span>Smart Quiz AI</span>
        </button>
        <nav className="flex items-center gap-6 text-sm font-semibold">
          {user && <Link to="/dashboard" className="text-gray-600 hover:text-gray-800 transition-colors">Dashboard</Link>}
          {user?.role === "faculty" && <Link to="/upload" className="text-gray-600 hover:text-gray-800 transition-colors">Upload</Link>}
          {user?.role === "faculty" && <Link to="/faculty/assignments" className="text-gray-600 hover:text-gray-800 transition-colors">Generate & Assign Quiz</Link>}
          {user?.role === "student" && <Link to="/student/assignments" className="text-gray-600 hover:text-gray-800 transition-colors">Assignments</Link>}
          {user?.role === "student" && <Link to="/quiz" className="text-gray-600 hover:text-gray-800 transition-colors">Quiz</Link>}
          {user?.role === "student" && <Link to="/summary" className="text-gray-600 hover:text-gray-800 transition-colors">Summary</Link>}
          {user?.role === "student" && <Link to="/chatbot" className="text-gray-600 hover:text-gray-800 transition-colors">Chatbot</Link>}
          {user && <Link to="/history" className="text-gray-600 hover:text-gray-800 transition-colors">History</Link>}
          {user && (
            <button onClick={onLogout} className="rounded-lg bg-blue-500 px-4 py-2 text-white hover:bg-blue-600 transition-colors border border-blue-500">Logout</button>
          )}
        </nav>
      </div>
    </header>
  );
}
