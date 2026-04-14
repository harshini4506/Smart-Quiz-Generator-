const fs = require("fs");
const path = require("path");

const config = require("../config");

const tokenize = (text) =>
  String(text || "")
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter(Boolean);

const termFrequency = (tokens) => {
  const map = new Map();
  for (const token of tokens) {
    map.set(token, (map.get(token) || 0) + 1);
  }
  return map;
};

const cosineSimilarity = (a, b) => {
  let dot = 0;
  let normA = 0;
  let normB = 0;

  const keys = new Set([...a.keys(), ...b.keys()]);
  for (const key of keys) {
    const av = a.get(key) || 0;
    const bv = b.get(key) || 0;
    dot += av * bv;
    normA += av * av;
    normB += bv * bv;
  }

  if (normA === 0 || normB === 0) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
};

const getDocPath = (docId) => path.resolve(config.vectorDir, String(docId));

const readVectorChunks = (docId) => {
  const filePath = path.join(getDocPath(docId), "chunks.json");
  if (!fs.existsSync(filePath)) return [];
  const chunks = JSON.parse(fs.readFileSync(filePath, "utf-8"));
  return Array.isArray(chunks) ? chunks : [];
};

const createVectorStore = async (docId, chunks) => {
  const dir = getDocPath(docId);
  fs.mkdirSync(dir, { recursive: true });
  const payload = chunks.map((chunk) => ({
    text: chunk,
    tf: Object.fromEntries(termFrequency(tokenize(chunk))),
  }));
  fs.writeFileSync(path.join(dir, "chunks.json"), JSON.stringify(payload), "utf-8");
};

const similaritySearch = async (docId, query, k = 4) => {
  const chunks = readVectorChunks(docId);
  if (!chunks.length) return [];

  const queryTf = termFrequency(tokenize(query));

  const ranked = chunks
    .map((chunk) => ({
      text: chunk.text,
      score: cosineSimilarity(queryTf, new Map(Object.entries(chunk.tf))),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, k)
    .filter((item) => item.score > 0)
    .map((item) => item.text);

  return ranked;
};

const similaritySearchScored = async (docId, query, k = 4) => {
  const chunks = readVectorChunks(docId);
  if (!chunks.length) return [];

  const queryTf = termFrequency(tokenize(query));
  return chunks
    .map((chunk) => ({
      text: chunk.text,
      score: cosineSimilarity(queryTf, new Map(Object.entries(chunk.tf || {}))),
    }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, k);
};

const similaritySearchMulti = async (docId, queries, options = {}) => {
  const perQuery = Number(options.perQuery || 4);
  const limit = Number(options.limit || 10);
  const uniqueQueries = [...new Set((queries || []).map((q) => String(q || "").trim()).filter(Boolean))];
  if (!uniqueQueries.length) return [];

  const merged = [];
  for (const query of uniqueQueries) {
    const hits = await similaritySearchScored(docId, query, perQuery);
    merged.push(...hits);
  }

  const byText = new Map();
  for (const item of merged) {
    const key = String(item.text || "").trim();
    if (!key) continue;
    const prev = byText.get(key);
    if (!prev || item.score > prev.score) {
      byText.set(key, item);
    }
  }

  return [...byText.values()]
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((item) => item.text);
};

module.exports = { createVectorStore, similaritySearch, similaritySearchScored, similaritySearchMulti, readVectorChunks };
