const jwt = require("jsonwebtoken");
const config = require("../config");
const User = require("../models/User");

const normalizeRole = (value) => {
  const role = String(value || "").trim().toLowerCase();
  if (role === "faculty" || role === "student") return role;
  return "student";
};

const tokenRequired = async (req, res, next) => {
  const authHeader = req.headers.authorization || "";
  if (!authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Missing bearer token" });
  }

  const token = authHeader.slice(7).trim();
  if (!token) {
    return res.status(401).json({ error: "Missing bearer token" });
  }

  try {
    const payload = jwt.verify(token, config.jwtSecret);
    const user = await User.findById(payload.user_id).lean();
    if (!user) {
      return res.status(401).json({ error: "User not found" });
    }
    req.user = { ...user, role: normalizeRole(user.role) };
    return next();
  } catch (error) {
    if (error && error.name === "TokenExpiredError") {
      return res.status(401).json({ error: "Token expired" });
    }
    return res.status(401).json({ error: "Invalid token" });
  }
};

const requireRole = (...roles) => (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({ error: "Forbidden" });
  }
  return next();
};

module.exports = { tokenRequired, requireRole };
