const path = require("path");
const dotenv = require("dotenv");

dotenv.config();

const asBool = (value, fallback = false) => {
  if (value == null) return fallback;
  return String(value).toLowerCase() === "true";
};

const asNumber = (value, fallback) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

module.exports = {
  env: process.env.NODE_ENV || "development",
  debug: asBool(process.env.DEBUG, false),
  port: asNumber(process.env.PORT, 5000),
  mongoUri: process.env.MONGO_URI || "mongodb://127.0.0.1:27017/smart_quiz_ai",
  jwtSecret: process.env.JWT_SECRET || "change-me-jwt",
  jwtExpHours: asNumber(process.env.JWT_EXP_HOURS, 24),
  openAiApiKey: process.env.OPENAI_API_KEY || "",
  llmModel: process.env.LLM_MODEL || "gpt-4o-mini",
  maxUploadMb: asNumber(process.env.MAX_UPLOAD_MB, 15),
  uploadDir: process.env.UPLOAD_DIR || path.join("storage", "uploads"),
  vectorDir: process.env.VECTOR_DIR || path.join("storage", "vectors"),
  corsOrigins: (process.env.CORS_ORIGINS || "*").split(",").map((o) => o.trim()),
};
