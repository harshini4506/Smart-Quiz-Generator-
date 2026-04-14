const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const config = require("../config");
const User = require("../models/User");
const { normalizeEmail, validateEmail, validatePassword } = require("../utils/validators");

const normalizeRole = (value) => {
  const role = String(value || "").trim().toLowerCase();
  if (role === "faculty" || role === "student") return role;
  return "student";
};

const signToken = (userId) =>
  jwt.sign({ user_id: String(userId) }, config.jwtSecret, {
    expiresIn: `${config.jwtExpHours}h`,
  });

const signupUser = async (payload) => {
  const name = String(payload.name || "").trim();
  const email = normalizeEmail(payload.email);
  const password = String(payload.password || "");
  const role = String(payload.role || "student").toLowerCase();

  if (!name || !email || !password) {
    return [{ error: "name, email, and password are required" }, 400];
  }
  if (!validateEmail(email)) {
    return [{ error: "invalid email" }, 400];
  }
  if (!validatePassword(password)) {
    return [{ error: "password must be 8+ chars and include letters and numbers" }, 400];
  }
  if (!["student", "faculty"].includes(role)) {
    return [{ error: "role must be student or faculty" }, 400];
  }

  const existing = await User.findOne({ email }).lean();
  if (existing) {
    return [{ error: "email already in use" }, 409];
  }

  const hashed = await bcrypt.hash(password, 10);
  const created = await User.create({ name, email, password: hashed, role, uploadedFiles: [] });
  const token = signToken(created._id);

  return [
    {
      token,
      user: { id: String(created._id), name: created.name, email: created.email, role: normalizeRole(created.role) },
    },
    201,
  ];
};

const loginUser = async (payload) => {
  const email = normalizeEmail(payload.email);
  const password = String(payload.password || "");
  const role = payload.role ? String(payload.role).toLowerCase() : "";

  if (!email || !password) {
    return [{ error: "email and password are required" }, 400];
  }

  const user = await User.findOne({ email });
  if (!user) {
    return [{ error: "invalid credentials" }, 401];
  }

  if (role && user.role !== role) {
    return [{ error: "account type mismatch" }, 401];
  }

  const ok = await bcrypt.compare(password, user.password);
  if (!ok) {
    return [{ error: "invalid credentials" }, 401];
  }

  const token = signToken(user._id);
  return [
    {
      token,
      user: { id: String(user._id), name: user.name, email: user.email, role: normalizeRole(user.role) },
    },
    200,
  ];
};

module.exports = { signupUser, loginUser };
