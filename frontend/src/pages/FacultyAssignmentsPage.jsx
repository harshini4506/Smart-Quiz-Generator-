import React, { useEffect, useState } from "react";

import api from "../services/api";

export default function FacultyAssignmentsPage() {
  const [docs, setDocs] = useState([]);
  const [students, setStudents] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [selectedAssignmentId, setSelectedAssignmentId] = useState("");
  const [submissions, setSubmissions] = useState([]);
  const [loadingSubmissions, setLoadingSubmissions] = useState(false);
  const [status, setStatus] = useState("");
  const [popupMessage, setPopupMessage] = useState("");

  const [form, setForm] = useState({
    title: "",
    doc_id: "",
    num_questions: 5,
    difficulty: "easy",
    deadline: "",
    student_ids: [],
  });
  const [assignToAll, setAssignToAll] = useState(true);

  const selectedDoc = docs.find((doc) => String(doc._id) === String(form.doc_id)) || null;
  const recommendedMax = Number(selectedDoc?.metadata?.question_capacity || 30);

  const loadBaseData = async () => {
    try {
      const [{ data: historyData }, { data: studentsData }, { data: assignmentData }] = await Promise.all([
        api.get("/history"),
        api.get("/students"),
        api.get("/faculty/assignments"),
      ]);
      setDocs(historyData.files || []);
      setStudents(studentsData.students || []);
      setAssignments(assignmentData.assignments || []);
    } catch (err) {
      setStatus(err?.response?.data?.error || "Failed to load faculty data");
    }
  };

  useEffect(() => {
    loadBaseData();
  }, []);

  const createAssignment = async (e) => {
    e.preventDefault();
    setStatus("");
    if (Number(form.num_questions) > recommendedMax) {
      const message = `This document only supports about ${recommendedMax} questions. Please request ${recommendedMax} or fewer questions, or upload a longer document.`;
      setStatus(message);
      setPopupMessage(message);
      return;
    }
    try {
      const payload = {
        ...form,
        student_ids: assignToAll ? [] : form.student_ids,
      };
      await api.post("/faculty/assignments", payload);
      setStatus("Quiz generated and assigned successfully.");
      setForm((prev) => ({ ...prev, title: "", student_ids: [] }));
      setAssignToAll(true);
      await loadBaseData();
    } catch (err) {
      setStatus(err?.response?.data?.error || "Failed to create assignment");
    }
  };

  const toggleStudent = (id) => {
    setForm((prev) => {
      const exists = prev.student_ids.includes(id);
      return {
        ...prev,
        student_ids: exists ? prev.student_ids.filter((s) => s !== id) : [...prev.student_ids, id],
      };
    });
  };

  const loadSubmissions = async (assignmentId) => {
    if (selectedAssignmentId === assignmentId) {
      setSelectedAssignmentId("");
      setSubmissions([]);
      return;
    }

    setStatus("");
    setSelectedAssignmentId(assignmentId);
    setSubmissions([]);
    setLoadingSubmissions(true);
    try {
      const { data } = await api.get(`/faculty/assignments/${assignmentId}/submissions`);
      setSubmissions(data.submissions || []);
    } catch (err) {
      setStatus(err?.response?.data?.error || "Failed to load submissions");
    } finally {
      setLoadingSubmissions(false);
    }
  };

  const gradeSubmission = async (submissionId, marks, feedback) => {
    try {
      await api.post(`/faculty/submissions/${submissionId}/grade`, { marks: Number(marks), feedback });
      if (selectedAssignmentId) {
        await loadSubmissions(selectedAssignmentId);
      }
      await loadBaseData();
      setStatus("Marks sent to student.");
    } catch (err) {
      setStatus(err?.response?.data?.error || "Failed to grade submission");
    }
  };

  return (
    <div className="min-h-screen bg-white py-8">
      <div className="mx-auto max-w-6xl px-4 space-y-8">
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
                  onClick={() => setPopupMessage("")}
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
                  onClick={() => setPopupMessage("")}
                  className="rounded-xl bg-gray-900 px-5 py-3 font-semibold text-white hover:bg-gray-800 transition-colors"
                >
                  Okay
                </button>
              </div>
            </div>
          </div>
        )}
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-800">Faculty Assignment Panel</h1>
          <p className="text-gray-600 mt-2">Generate quizzes from your documents, assign them to students, and evaluate submissions.</p>
        </div>

        {status && <p className="rounded-lg border border-gray-200 bg-gray-50 p-3 text-gray-700">{status}</p>}

        <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-md">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Generate Quiz And Assign</h2>
          <form onSubmit={createAssignment} className="grid gap-4 md:grid-cols-2">
            <input
              className="rounded-xl border border-gray-300 bg-gray-50 p-3 text-gray-800"
              placeholder="Assignment title"
              value={form.title}
              onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
            />

            <select
              className="rounded-xl border border-gray-300 bg-gray-50 p-3 text-gray-800"
              value={form.doc_id}
              onChange={(e) => setForm((prev) => ({ ...prev, doc_id: e.target.value }))}
              required
            >
              <option value="">Select uploaded document</option>
              {docs.map((d) => (
                <option key={d._id} value={d._id}>{d.filename}</option>
              ))}
            </select>

            <input
              className="rounded-xl border border-gray-300 bg-gray-50 p-3 text-gray-800"
              type="number"
              min={1}
              max={recommendedMax}
              value={form.num_questions}
              onChange={(e) => setForm((prev) => ({ ...prev, num_questions: Number(e.target.value) }))}
            />
            <p className="md:col-span-2 -mt-2 text-sm text-gray-500">
              {selectedDoc
                ? `Based on this upload, you can generate up to about ${recommendedMax} questions.`
                : "Select a document to see the recommended question limit."}
            </p>

            <select
              className="rounded-xl border border-gray-300 bg-gray-50 p-3 text-gray-800"
              value={form.difficulty}
              onChange={(e) => setForm((prev) => ({ ...prev, difficulty: e.target.value }))}
            >
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>

            <input
              className="rounded-xl border border-gray-300 bg-gray-50 p-3 text-gray-800 md:col-span-2"
              type="datetime-local"
              value={form.deadline}
              onChange={(e) => setForm((prev) => ({ ...prev, deadline: e.target.value }))}
              required
            />

            <div className="md:col-span-2 rounded-xl border border-gray-300 p-3">
              <label className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-700">
                <input
                  type="checkbox"
                  checked={assignToAll}
                  onChange={(e) => setAssignToAll(e.target.checked)}
                />
                <span>Assign to all students</span>
              </label>

              {students.length === 0 ? (
                <p className="text-sm text-gray-600">No students registered yet.</p>
              ) : (
                <div className="grid gap-2 md:grid-cols-2">
                  {students.map((s) => (
                    <label key={s.id} className="flex items-center gap-2 text-sm text-gray-700">
                      <input
                        type="checkbox"
                        disabled={assignToAll}
                        checked={form.student_ids.includes(s.id)}
                        onChange={() => toggleStudent(s.id)}
                      />
                      <span>{s.name} ({s.email})</span>
                    </label>
                  ))}
                </div>
              )}
              <p className="mt-2 text-xs text-gray-500">
                {assignToAll ? `This quiz will be visible to all ${students.length} students.` : `Selected students: ${form.student_ids.length}`}
              </p>
            </div>

            <button className="md:col-span-2 rounded-xl bg-blue-500 px-6 py-3 font-bold text-white hover:bg-blue-600 transition-colors">
              Create And Assign Quiz
            </button>
          </form>
        </section>

        <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-md">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Your Assignments</h2>
          <div className="space-y-3">
            {assignments.length === 0 && <p className="text-gray-600">No assignments created yet.</p>}
            {assignments.map((a) => (
              <div key={a.id} className="rounded-xl border border-gray-200 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-bold text-gray-800">{a.title}</p>
                    <p className="text-sm text-gray-600">Deadline: {new Date(a.deadline).toLocaleString()}</p>
                    <p className="text-sm text-gray-600">Assigned: {a.assigned_students.length} | Submitted: {a.submitted_count}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => loadSubmissions(a.id)}
                    className="rounded-lg border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-50"
                  >
                    {selectedAssignmentId === a.id ? "Hide Submissions" : "View Submissions"}
                  </button>
                </div>

                {selectedAssignmentId === a.id && (
                  <div className="mt-4 rounded-xl border border-gray-200 bg-gray-50 p-4">
                    <h3 className="text-lg font-bold text-gray-800 mb-3">Submissions</h3>

                    {loadingSubmissions && <p className="text-gray-600">Loading submissions...</p>}

                    {!loadingSubmissions && submissions.length === 0 && (
                      <p className="text-gray-600">No submissions yet.</p>
                    )}

                    {!loadingSubmissions && submissions.length > 0 && (
                      <div className="space-y-4">
                        {submissions.map((sub) => (
                          <div key={sub.id} className="rounded-xl border border-gray-200 bg-white p-4 space-y-3">
                            <p className="font-semibold text-gray-800">
                              {sub.student?.name || "Student"} ({sub.student?.email || ""})
                            </p>
                            <p className="text-sm text-gray-600">Submitted: {new Date(sub.submitted_at).toLocaleString()}</p>

                            <div className="rounded-lg bg-gray-50 p-3">
                              {(sub.answers || []).map((ans, i) => (
                                <p key={i} className="text-sm text-gray-700 mb-1">Q{i + 1}: {String(ans || "")}</p>
                              ))}
                            </div>

                            <GradeForm
                              submission={sub}
                              onGrade={(marks, feedback) => gradeSubmission(sub.id, marks, feedback)}
                            />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

function GradeForm({ submission, onGrade }) {
  const [marks, setMarks] = useState(submission.marks ?? "");
  const [feedback, setFeedback] = useState(submission.feedback || "");

  return (
    <div className="grid gap-2 md:grid-cols-2">
      <input
        className="rounded-lg border border-gray-300 bg-gray-50 p-2 text-gray-800"
        type="number"
        min={0}
        max={100}
        value={marks}
        onChange={(e) => setMarks(e.target.value)}
        placeholder="Marks (0-100)"
      />
      <input
        className="rounded-lg border border-gray-300 bg-gray-50 p-2 text-gray-800"
        value={feedback}
        onChange={(e) => setFeedback(e.target.value)}
        placeholder="Feedback"
      />
      <button
        onClick={() => onGrade(marks, feedback)}
        className="md:col-span-2 rounded-lg bg-blue-500 px-4 py-2 font-semibold text-white hover:bg-blue-600"
      >
        Save Marks
      </button>
    </div>
  );
}
