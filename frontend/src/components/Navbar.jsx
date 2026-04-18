import React, { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

export default function Navbar({ user, onLogout }) {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const navItems = useMemo(() => {
    const items = [];
    if (user) items.push({ to: "/dashboard", label: "Dashboard" });
    if (user?.role === "faculty") items.push({ to: "/upload", label: "Upload" });
    if (user?.role === "faculty") items.push({ to: "/faculty/assignments", label: "Generate & Assign Quiz" });
    if (user?.role === "student") items.push({ to: "/student/assignments", label: "Assignments" });
    if (user?.role === "student") items.push({ to: "/quiz", label: "Quiz" });
    if (user?.role === "student") items.push({ to: "/summary", label: "Summary" });
    if (user?.role === "student") items.push({ to: "/chatbot", label: "Chatbot" });
    if (user) items.push({ to: "/history", label: "History" });
    return items;
  }, [user]);

  const closeMenu = () => setMenuOpen(false);

  return (
    <header className="bg-white border-b border-gray-200 shadow-lg sticky top-0 z-50">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 sm:py-4">
        <button
          onClick={() => {
            navigate("/dashboard");
            closeMenu();
          }}
          className="text-xl font-bold text-gray-800 hover:text-blue-600 transition-colors flex items-center gap-2"
        >
          <span className="text-xl sm:text-2xl">📚</span>
          <span className="text-base sm:text-xl">Smart Quiz AI</span>
        </button>

        <button
          type="button"
          onClick={() => setMenuOpen((prev) => !prev)}
          className="inline-flex items-center justify-center rounded-lg border border-gray-300 p-2 text-gray-700 md:hidden"
          aria-label="Toggle menu"
          aria-expanded={menuOpen}
        >
          <span className="text-xl">{menuOpen ? "✕" : "☰"}</span>
        </button>

        <nav className="hidden md:flex items-center gap-6 text-sm font-semibold">
          {navItems.map((item) => (
            <Link key={item.to} to={item.to} className="text-gray-600 hover:text-gray-800 transition-colors">
              {item.label}
            </Link>
          ))}
          {user && (
            <button onClick={onLogout} className="rounded-lg bg-blue-500 px-4 py-2 text-white hover:bg-blue-600 transition-colors border border-blue-500">Logout</button>
          )}
        </nav>
      </div>

      {menuOpen && (
        <div className="border-t border-gray-200 bg-white px-4 py-3 md:hidden">
          <nav className="flex flex-col gap-2 text-sm font-semibold">
            {navItems.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                onClick={closeMenu}
                className="rounded-lg px-2 py-2 text-gray-700 hover:bg-gray-100"
              >
                {item.label}
              </Link>
            ))}
            {user && (
              <button
                onClick={() => {
                  closeMenu();
                  onLogout();
                }}
                className="mt-1 rounded-lg bg-blue-500 px-4 py-2 text-white hover:bg-blue-600 transition-colors border border-blue-500"
              >
                Logout
              </button>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
