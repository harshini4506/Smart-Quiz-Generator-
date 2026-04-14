const FileMeta = require("../models/FileMeta");
const { sanitizeText } = require("../utils/validators");
const { similaritySearchMulti } = require("../utils/vectorStore");
const { askText } = require("./ai");

const fallbackAnswer = (chunks) => {
  const best = chunks.join("\n\n").slice(0, 1800);
  if (!best) {
    return "I could not find relevant information in the uploaded document yet.";
  }
  return `Based on your uploaded document, here is the most relevant information:\n\n${best}`;
};

const answerQuestion = async (payload, user) => {
  const question = sanitizeText(payload.question || "");
  const docId = payload.doc_id || "";

  if (!question || !docId) return [{ error: "question and doc_id are required" }, 400];

  const doc = await FileMeta.findOne({ _id: docId, user_id: user._id }).lean();
  if (!doc) return [{ error: "document not found" }, 404];

  const queries = [
    question,
    ...(Array.isArray(doc.keywords) ? doc.keywords.slice(0, 8) : []),
    "key explanation",
  ];
  const contextChunks = await similaritySearchMulti(docId, queries, { perQuery: 4, limit: 10 });
  if (!contextChunks.length) {
    return [{ answer: "I could not find relevant information in the uploaded document yet." }, 200];
  }

  const prompt = `
You are a friendly study assistant.
Answer using only this context. If information is missing, state that clearly.
Keep answers concise and easy for students.
Context:\n${contextChunks.join("\n\n")}
Question:\n${question}
  `;

  const answer = await askText(prompt, () => fallbackAnswer(contextChunks));
  return [{ answer }, 200];
};

module.exports = { answerQuestion };
