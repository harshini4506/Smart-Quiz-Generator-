const Assignment = require("../models/Assignment");
const AssignmentSubmission = require("../models/AssignmentSubmission");
const User = require("../models/User");
const { generateQuiz } = require("./quizService");

const STUDENT_QUERY = {
  $or: [{ role: "student" }, { role: "user" }, { role: { $exists: false } }, { role: null }],
};

const createAssignment = async (payload, faculty) => {
  const title = String(payload.title || "").trim() || "Assigned Quiz";
  const docId = String(payload.doc_id || "").trim();
  const numQuestions = Number(payload.num_questions || 5);
  const difficulty = String(payload.difficulty || "easy").toLowerCase();
  const deadline = payload.deadline ? new Date(payload.deadline) : null;
  const studentIds = Array.isArray(payload.student_ids) ? payload.student_ids.map(String) : [];

  if (!docId || !deadline || Number.isNaN(deadline.getTime())) {
    return [{ error: "doc_id and a valid deadline are required" }, 400];
  }
  if (deadline.getTime() <= Date.now()) {
    return [{ error: "deadline must be in the future" }, 400];
  }
  let students = [];
  if (studentIds.length) {
    students = await User.find({ _id: { $in: studentIds }, ...STUDENT_QUERY }).lean();
  } else {
    students = await User.find(STUDENT_QUERY).lean();
  }
  if (!students.length) {
    return [{ error: "no student accounts found to assign this quiz" }, 400];
  }

  const [quizResult, quizStatus] = await generateQuiz(
    { doc_id: docId, num_questions: numQuestions, difficulty },
    faculty
  );

  if (quizStatus !== 200) {
    return [quizResult, quizStatus];
  }

  const assignment = await Assignment.create({
    faculty_id: faculty._id,
    doc_id: docId,
    title,
    questions: quizResult.questions || [],
    difficulty,
    deadline,
    assigned_students: students.map((s) => s._id),
  });

  return [
    {
      assignment_id: String(assignment._id),
      title: assignment.title,
      deadline: assignment.deadline,
      assigned_count: assignment.assigned_students.length,
      questions_count: assignment.questions.length,
    },
    201,
  ];
};

const listFacultyAssignments = async (faculty) => {
  const assignments = await Assignment.find({ faculty_id: faculty._id })
    .sort({ createdAt: -1 })
    .populate("assigned_students", "name email")
    .lean();

  const assignmentIds = assignments.map((a) => a._id);
  const submissions = await AssignmentSubmission.find({ assignment_id: { $in: assignmentIds } }).lean();
  const byAssignment = submissions.reduce((acc, sub) => {
    const key = String(sub.assignment_id);
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});

  return [
    {
      assignments: assignments.map((a) => ({
        id: String(a._id),
        title: a.title,
        difficulty: a.difficulty,
        deadline: a.deadline,
        questions_count: (a.questions || []).length,
        assigned_students: (a.assigned_students || []).map((s) => ({ id: String(s._id), name: s.name, email: s.email })),
        submitted_count: byAssignment[String(a._id)] || 0,
      })),
    },
    200,
  ];
};

const listFacultySubmissions = async (assignmentId, faculty) => {
  const assignment = await Assignment.findOne({ _id: assignmentId, faculty_id: faculty._id }).lean();
  if (!assignment) {
    return [{ error: "assignment not found" }, 404];
  }

  const submissions = await AssignmentSubmission.find({ assignment_id: assignment._id })
    .sort({ submitted_at: -1 })
    .populate("student_id", "name email")
    .lean();

  return [
    {
      assignment: {
        id: String(assignment._id),
        title: assignment.title,
        deadline: assignment.deadline,
      },
      submissions: submissions.map((s) => ({
        id: String(s._id),
        student: s.student_id ? { id: String(s.student_id._id), name: s.student_id.name, email: s.student_id.email } : null,
        answers: s.answers || [],
        submitted_at: s.submitted_at,
        marks: s.marks,
        feedback: s.feedback || "",
        graded_at: s.graded_at,
      })),
    },
    200,
  ];
};

const submitStudentAssignment = async (assignmentId, payload, student) => {
  const assignment = await Assignment.findById(assignmentId).lean();
  if (!assignment) {
    return [{ error: "assignment not found" }, 404];
  }

  const assigned = (assignment.assigned_students || []).some((id) => String(id) === String(student._id));
  if (!assigned) {
    return [{ error: "assignment not assigned to this student" }, 403];
  }

  if (new Date(assignment.deadline).getTime() < Date.now()) {
    return [{ error: "deadline has passed" }, 400];
  }

  const existing = await AssignmentSubmission.findOne({ assignment_id: assignment._id, student_id: student._id }).lean();
  if (existing) {
    return [{ error: "assignment already submitted" }, 400];
  }

  const answers = Array.isArray(payload.answers) ? payload.answers : [];
  if (!answers.length) {
    return [{ error: "answers are required" }, 400];
  }

  const created = await AssignmentSubmission.create({
    assignment_id: assignment._id,
    student_id: student._id,
    answers,
    submitted_at: new Date(),
  });

  return [{ submission_id: String(created._id), message: "submission saved" }, 201];
};

const listStudentAssignments = async (student) => {
  const assignments = await Assignment.find({ assigned_students: student._id })
    .sort({ deadline: 1 })
    .populate("faculty_id", "name email")
    .lean();

  const assignmentIds = assignments.map((a) => a._id);
  const submissions = await AssignmentSubmission.find({ assignment_id: { $in: assignmentIds }, student_id: student._id }).lean();
  const byAssignment = submissions.reduce((acc, sub) => {
    acc[String(sub.assignment_id)] = sub;
    return acc;
  }, {});

  return [
    {
      assignments: assignments.map((a) => {
        const submission = byAssignment[String(a._id)] || null;
        return {
          id: String(a._id),
          title: a.title,
          questions: a.questions || [],
          deadline: a.deadline,
          faculty: a.faculty_id ? { name: a.faculty_id.name, email: a.faculty_id.email } : null,
          submitted: Boolean(submission),
          marks: submission ? submission.marks : null,
          feedback: submission ? submission.feedback : "",
        };
      }),
    },
    200,
  ];
};

const gradeSubmission = async (submissionId, payload, faculty) => {
  const marks = Number(payload.marks);
  const feedback = String(payload.feedback || "").trim();

  if (!Number.isFinite(marks) || marks < 0 || marks > 100) {
    return [{ error: "marks must be between 0 and 100" }, 400];
  }

  const submission = await AssignmentSubmission.findById(submissionId);
  if (!submission) {
    return [{ error: "submission not found" }, 404];
  }

  const assignment = await Assignment.findById(submission.assignment_id).lean();
  if (!assignment || String(assignment.faculty_id) !== String(faculty._id)) {
    return [{ error: "forbidden" }, 403];
  }

  submission.marks = marks;
  submission.feedback = feedback;
  submission.graded_by = faculty._id;
  submission.graded_at = new Date();
  await submission.save();

  return [{ message: "graded successfully", marks: submission.marks, feedback: submission.feedback }, 200];
};

const listStudentGrades = async (student) => {
  const submissions = await AssignmentSubmission.find({ student_id: student._id, marks: { $ne: null } })
    .sort({ graded_at: -1 })
    .populate("assignment_id", "title deadline")
    .lean();

  return [
    {
      grades: submissions.map((s) => ({
        submission_id: String(s._id),
        assignment_id: s.assignment_id ? String(s.assignment_id._id) : "",
        assignment_title: s.assignment_id ? s.assignment_id.title : "Assignment",
        deadline: s.assignment_id ? s.assignment_id.deadline : null,
        marks: s.marks,
        feedback: s.feedback || "",
        graded_at: s.graded_at,
      })),
    },
    200,
  ];
};

module.exports = {
  createAssignment,
  listFacultyAssignments,
  listFacultySubmissions,
  submitStudentAssignment,
  listStudentAssignments,
  gradeSubmission,
  listStudentGrades,
};
