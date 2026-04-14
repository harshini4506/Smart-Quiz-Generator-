const FileMeta = require("../models/FileMeta");
const { askJson } = require("./ai");
const { similaritySearchMulti } = require("../utils/vectorStore");

const rankSentences = (text, keywords) => {
  const keySet = new Set((keywords || []).map((k) => String(k || "").toLowerCase()));
  const sentences = String(text || "")
    .split(/[.!?]+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 35);

  return sentences
    .map((sentence) => {
      const tokens = sentence.toLowerCase().split(/[^a-z0-9]+/).filter(Boolean);
      const keywordHits = tokens.reduce((acc, t) => acc + (keySet.has(t) ? 1 : 0), 0);
      const score = keywordHits * 2 + Math.min(tokens.length / 20, 2);
      return { sentence, score };
    })
    .sort((a, b) => b.score - a.score)
    .map((item) => item.sentence);
};

const fallbackSummary = (text, keywords) => {
  const ranked = rankSentences(text, keywords);
  const keyPoints = ranked.slice(0, 14).map((s) => s.replace(/\s+/g, " "));
  return {
    summary: keyPoints.slice(0, 6).map((item, idx) => `**Topic ${idx + 1}**\n${item}`).join("\n\n"),
    key_points: keyPoints,
    important_topics: (keywords || []).slice(0, 15),
  };
};

const buildSummaryContext = async (doc) => {
  const keywords = Array.isArray(doc.keywords) ? doc.keywords.slice(0, 14) : [];
  const queries = [
    ...keywords,
    "main ideas",
    "important concepts",
    "definitions",
    "conclusions",
  ];

  const chunks = await similaritySearchMulti(doc._id, queries, { perQuery: 3, limit: 16 });
  if (chunks.length) return chunks.join("\n\n");
  return String(doc.text || "").slice(0, 14000);
};

const summarizeDocument = async (docId, user) => {
  if (!docId) return [{ error: "doc_id is required" }, 400];

  const doc = await FileMeta.findOne({ _id: docId, user_id: user._id }).lean();
  if (!doc) return [{ error: "document not found" }, 404];

  const context = await buildSummaryContext(doc);

  const prompt = `
Create a comprehensive, topic-wise summary and return strict JSON.
Schema: {"summary": string, "key_points": string[], "important_topics": string[]}
Include 12-20 key_points and 8-15 important_topics.
Use only the context below. Keep points concise and study-friendly.
Context:\n${String(context || "").slice(0, 16000)}
  `;

  const result = await askJson(prompt, () => fallbackSummary(context, doc.keywords));
  result.summary = result.summary || "";
  result.key_points = Array.isArray(result.key_points) ? result.key_points : [];
  result.important_topics = Array.isArray(result.important_topics)
    ? result.important_topics
    : (doc.keywords || []).slice(0, 15);

  return [result, 200];
};

module.exports = { summarizeDocument };
