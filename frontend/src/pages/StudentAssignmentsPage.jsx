import React, { useEffect, useMemo, useState } from "react";

import api from "../services/api";

export default function StudentAssignmentsPage() {
  const [assignments, setAssignments] = useState([]);
  const [grades, setGrades] = useState([]);
  const [status, setStatus] = useState("");
  const [activeAssignmentId, setActiveAssignmentId] = useState("");
  const [answers, setAnswers] = useState([]);

  const loadData = async () => {
    try {
      const [{ data: assignmentData }, { data: gradeData }] = await Promise.all([
        api.get("/student/assignments"),
        api.get("/student/grades"),
      ]);
      setAssignments(assignmentData.assignments || []);
      setGrades(gradeData.grades || []);
    } catch (err) {
      setStatus(err?.response?.data?.error || "Failed to load assignments");
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const activeAssignment = useMemo(
    () => assignments.find((a) => a.id === activeAssignmentId) || null,
    [assignments, activeAssignmentId]
  );

  useEffect(() => {
    if (activeAssignment) {
      setAnswers(new Array((activeAssignment.questions || []).length).fill(""));
    }
  }, [activeAssignmentId]);

  const submitAssignment = async () => {
    if (!activeAssignment) return;
    try {
      await api.post(`/student/assignments/${activeAssignment.id}/submit`, { answers });
      setStatus("Assignment submitted successfully.");
      setActiveAssignmentId("");
      await loadData();
    } catch (err) {
      setStatus(err?.response?.data?.error || "Failed to submit assignment");
    }
  };

  return (
    <div className="min-h-screen bg-white py-8">
      <div className="mx-auto max-w-6xl px-4 space-y-8">
        <div className="text-center">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-800">Student Assignments</h1>
          <p className="text-gray-600 mt-2">Attempt assigned quizzes before deadline and check marks after faculty evaluation.</p>
        </div>

        {status && <p className="rounded-lg border border-gray-200 bg-gray-50 p-3 text-gray-700">{status}</p>}

        <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-md">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Assigned Quizzes</h2>
          <div className="space-y-3">
            {assignments.length === 0 && <p className="text-gray-600">No assignments yet.</p>}
            {assignments.map((a) => {
              const expired = new Date(a.deadline).getTime() < Date.now();
              return (
                <div key={a.id} className="rounded-xl border border-gray-200 p-4">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div>
                      <p className="font-bold text-gray-800">{a.title}</p>
                      <p className="text-sm text-gray-600">Faculty: {a.faculty?.name || "Faculty"}</p>
                      <p className="text-sm text-gray-600">Deadline: {new Date(a.deadline).toLocaleString()}</p>
                      <p className="text-sm text-gray-600">Status: {a.submitted ? "Submitted" : expired ? "Expired" : "Pending"}</p>
                    </div>
                    {!a.submitted && !expired && (
                      <button
                        onClick={() => setActiveAssignmentId(a.id)}
                        className="w-full sm:w-auto rounded-lg bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
                      >
                        Attempt Now
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {activeAssignment && (
          <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-md">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Attempt: {activeAssignment.title}</h2>
            <div className="space-y-4">
              {(activeAssignment.questions || []).map((q, idx) => (
                <div key={idx} className="rounded-xl border border-gray-200 p-4">
                  <p className="font-semibold text-gray-800 mb-2">Q{idx + 1}. {q.question}</p>
                  {Array.isArray(q.options) && q.options.length > 0 ? (
                    <div className="space-y-2">
                      {q.options.map((opt) => (
                        <label key={opt} className="flex items-center gap-2 text-gray-700">
                          <input
                            type="radio"
                            name={`q-${idx}`}
                            checked={answers[idx] === opt}
                            onChange={() => {
                              const next = [...answers];
                              next[idx] = opt;
                              setAnswers(next);
                            }}
                          />
                          <span>{opt}</span>
                        </label>
                      ))}
                    </div>
                  ) : (
                    <textarea
                      className="w-full rounded-lg border border-gray-300 bg-gray-50 p-3 text-gray-800"
                      rows={3}
                      value={answers[idx] || ""}
                      onChange={(e) => {
                        const next = [...answers];
                        next[idx] = e.target.value;
                        setAnswers(next);
                      }}
                    />
                  )}
                </div>
              ))}
            </div>
            <button
              onClick={submitAssignment}
              className="mt-4 w-full sm:w-auto rounded-xl bg-blue-500 px-6 py-3 font-bold text-white hover:bg-blue-600"
            >
              Submit Assignment
            </button>
          </section>
        )}

        <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-md">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Marks And Feedback</h2>
          <div className="space-y-3">
            {grades.length === 0 && <p className="text-gray-600">No graded assignments yet.</p>}
            {grades.map((g) => (
              <div key={g.submission_id} className="rounded-xl border border-gray-200 p-4">
                <p className="font-bold text-gray-800">{g.assignment_title}</p>
                <p className="text-sm text-gray-600">Marks: {g.marks}/100</p>
                <p className="text-sm text-gray-600">Feedback: {g.feedback || "No feedback"}</p>
                <p className="text-xs text-gray-500">Graded: {g.graded_at ? new Date(g.graded_at).toLocaleString() : "-"}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
