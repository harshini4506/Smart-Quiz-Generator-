const express = require("express");
const multer = require("multer");

const config = require("../config");
const { tokenRequired, requireRole } = require("../middleware/auth");
const { handleUpload } = require("../services/fileService");
const { generateQuiz, submitQuiz } = require("../services/quizService");
const { summarizeDocument } = require("../services/summaryService");
const { answerQuestion } = require("../services/chatService");
const { getHistory } = require("../services/historyService");
const {
  createAssignment,
  listFacultyAssignments,
  listFacultySubmissions,
  submitStudentAssignment,
  listStudentAssignments,
  gradeSubmission,
  listStudentGrades,
} = require("../services/assignmentService");
const User = require("../models/User");
const { validateFilename } = require("../utils/validators");

const router = express.Router();

const STUDENT_QUERY = {
  $or: [{ role: "student" }, { role: "user" }, { role: { $exists: false } }, { role: null }],
};

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: config.maxUploadMb * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!validateFilename(file.originalname)) {
      return cb(new Error("Unsupported file type. Allowed: pdf, docx, txt, ppt, pptx"));
    }
    return cb(null, true);
  },
});

router.post("/upload", tokenRequired, upload.single("file"), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "Missing file" });
    }
    const [result, status] = await handleUpload(req.file, req.user);
    return res.status(status).json(result);
  } catch (error) {
    return next(error);
  }
});

router.post("/generate-quiz", tokenRequired, async (req, res, next) => {
  try {
    const [result, status] = await generateQuiz(req.body || {}, req.user);
    res.status(status).json(result);
  } catch (error) {
    next(error);
  }
});

router.post("/submit-quiz", tokenRequired, async (req, res, next) => {
  try {
    const [result, status] = await submitQuiz(req.body || {}, req.user);
    res.status(status).json(result);
  } catch (error) {
    next(error);
  }
});

router.get("/summary", tokenRequired, async (req, res, next) => {
  try {
    const [result, status] = await summarizeDocument(req.query.doc_id || "", req.user);
    res.status(status).json(result);
  } catch (error) {
    next(error);
  }
});

router.post("/chat", tokenRequired, async (req, res, next) => {
  try {
    const [result, status] = await answerQuestion(req.body || {}, req.user);
    res.status(status).json(result);
  } catch (error) {
    next(error);
  }
});

router.get("/history", tokenRequired, async (_req, res, next) => {
  try {
    const [result, status] = await getHistory(_req.user);
    res.status(status).json(result);
  } catch (error) {
    next(error);
  }
});

router.get("/students", tokenRequired, requireRole("faculty"), async (_req, res, next) => {
  try {
    const students = await User.find(STUDENT_QUERY).sort({ name: 1 }).select("name email").lean();
    res.status(200).json({ students: students.map((s) => ({ id: String(s._id), name: s.name, email: s.email })) });
  } catch (error) {
    next(error);
  }
});

router.post("/faculty/assignments", tokenRequired, requireRole("faculty"), async (req, res, next) => {
  try {
    const [result, status] = await createAssignment(req.body || {}, req.user);
    res.status(status).json(result);
  } catch (error) {
    next(error);
  }
});

router.get("/faculty/assignments", tokenRequired, requireRole("faculty"), async (req, res, next) => {
  try {
    const [result, status] = await listFacultyAssignments(req.user);
    res.status(status).json(result);
  } catch (error) {
    next(error);
  }
});

router.get("/faculty/assignments/:id/submissions", tokenRequired, requireRole("faculty"), async (req, res, next) => {
  try {
    const [result, status] = await listFacultySubmissions(req.params.id, req.user);
    res.status(status).json(result);
  } catch (error) {
    next(error);
  }
});

router.post("/faculty/submissions/:id/grade", tokenRequired, requireRole("faculty"), async (req, res, next) => {
  try {
    const [result, status] = await gradeSubmission(req.params.id, req.body || {}, req.user);
    res.status(status).json(result);
  } catch (error) {
    next(error);
  }
});

router.get("/student/assignments", tokenRequired, requireRole("student"), async (req, res, next) => {
  try {
    const [result, status] = await listStudentAssignments(req.user);
    res.status(status).json(result);
  } catch (error) {
    next(error);
  }
});

router.post("/student/assignments/:id/submit", tokenRequired, requireRole("student"), async (req, res, next) => {
  try {
    const [result, status] = await submitStudentAssignment(req.params.id, req.body || {}, req.user);
    res.status(status).json(result);
  } catch (error) {
    next(error);
  }
});

router.get("/student/grades", tokenRequired, requireRole("student"), async (req, res, next) => {
  try {
    const [result, status] = await listStudentGrades(req.user);
    res.status(status).json(result);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
