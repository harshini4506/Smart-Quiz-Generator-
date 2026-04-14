const fs = require("fs");
const path = require("path");

const config = require("../config");
const User = require("../models/User");
const FileMeta = require("../models/FileMeta");
const { extractTextFromFile } = require("../utils/extractText");
const {
  sanitizeFilename,
  validateFilename,
  sanitizeText,
  chunkText,
  extractKeywords,
  estimateQuestionCapacity,
} = require("../utils/validators");
const { createVectorStore } = require("../utils/vectorStore");

const handleUpload = async (file, user) => {
  const filename = file?.originalname || "";
  if (!validateFilename(filename)) {
    return [{ error: "Unsupported file type. Allowed: pdf, docx, txt, ppt, pptx" }, 400];
  }

  const safeName = sanitizeFilename(filename);
  const savedPath = path.resolve(config.uploadDir, `${Date.now()}_${safeName}`);
  fs.mkdirSync(path.dirname(savedPath), { recursive: true });
  fs.writeFileSync(savedPath, file.buffer);

  const rawText = await extractTextFromFile(savedPath, filename);
  const cleanedText = sanitizeText(rawText);
  if (!cleanedText) {
    return [{ error: "No readable text found in file" }, 400];
  }

  const chunks = chunkText(cleanedText);
  const keywords = extractKeywords(cleanedText);
  const questionCapacity = estimateQuestionCapacity({
    text: cleanedText,
    keywords,
    chunkCount: chunks.length,
  });
  const metadata = {
    size: file.size,
    chunk_count: chunks.length,
    path: savedPath,
    question_capacity: questionCapacity,
  };

  const created = await FileMeta.create({
    user_id: user._id,
    filename: safeName,
    metadata,
    text: cleanedText,
    keywords,
  });

  await createVectorStore(created._id, chunks);
  await User.updateOne({ _id: user._id }, { $push: { uploadedFiles: created._id } });

  return [
    {
      message: "File uploaded and indexed",
      file_id: String(created._id),
      keywords,
      question_capacity: questionCapacity,
    },
    201,
  ];
};

module.exports = { handleUpload };
