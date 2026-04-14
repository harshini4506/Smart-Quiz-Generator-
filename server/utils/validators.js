const path = require("path");

const EMAIL_REGEX = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
const ALLOWED_EXTENSIONS = new Set(["pdf", "docx", "txt", "ppt", "pptx"]);

const normalizeEmail = (email) => String(email || "").trim().toLowerCase();

const validateEmail = (email) => EMAIL_REGEX.test(normalizeEmail(email));

const validatePassword = (password) => {
  const value = String(password || "");
  if (value.length < 8) return false;
  const hasLetter = /[A-Za-z]/.test(value);
  const hasDigit = /\d/.test(value);
  return hasLetter && hasDigit;
};

const sanitizeFilename = (filename) => {
  const ext = path.extname(filename || "").toLowerCase();
  const base = path.basename(filename || "", ext).replace(/[^A-Za-z0-9._-]/g, "_");
  return `${base}${ext}`;
};

const validateFilename = (filename) => {
  if (!filename || !filename.includes(".")) return false;
  const ext = filename.split(".").pop().toLowerCase();
  return ALLOWED_EXTENSIONS.has(ext);
};

const sanitizeText = (value) => String(value || "").replace(/\s+/g, " ").trim();

const countWords = (text) => String(text || "").trim().split(/\s+/).filter(Boolean).length;

const countReadableSentences = (text) =>
  String(text || "")
    .split(/[.!?]+/)
    .map((sentence) => sentence.trim())
    .filter((sentence) => sentence.length > 30).length;

const estimateQuestionCapacity = ({ text = "", keywords = [], chunkCount = 0, difficulty = "medium" } = {}) => {
  const words = countWords(text);
  const sentences = countReadableSentences(text);
  const keywordCount = Array.isArray(keywords) ? keywords.length : 0;

  let capacity = Math.floor(words / 55) + Math.floor(sentences / 3) + Math.floor(keywordCount / 3) + Math.floor(chunkCount / 2);

  if (difficulty === "hard") {
    capacity -= 2;
  } else if (difficulty === "easy") {
    capacity += 1;
  }

  return Math.max(3, capacity);
};

const chunkText = (text, chunkSize = 700, overlap = 120) => {
  const value = String(text || "");
  const chunks = [];
  let start = 0;
  while (start < value.length) {
    const end = start + chunkSize;
    chunks.push(value.slice(start, end));
    start = end - overlap;
  }
  return chunks;
};

const extractKeywords = (text, limit = 12) => {
  const stop = new Set([
    "the", "and", "for", "that", "with", "this", "from", "are", "was", "were",
    "have", "has", "had", "you", "your", "be", "is", "in", "on", "at", "to", "of",
    "by", "as", "or", "an", "a", "not", "no", "but", "can", "will", "should", "would",
  ]);

  const words = String(text || "")
    .split(/[^A-Za-z]+/)
    .map((w) => w.toLowerCase())
    .filter((w) => w.length > 4 && !stop.has(w));

  const counts = new Map();
  for (const word of words) {
    counts.set(word, (counts.get(word) || 0) + 1);
  }

  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([word]) => word);
};

module.exports = {
  normalizeEmail,
  validateEmail,
  validatePassword,
  sanitizeFilename,
  validateFilename,
  sanitizeText,
  countWords,
  countReadableSentences,
  estimateQuestionCapacity,
  chunkText,
  extractKeywords,
  ALLOWED_EXTENSIONS,
};
