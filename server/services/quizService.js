const FileMeta = require("../models/FileMeta");
const QuizAttempt = require("../models/QuizAttempt");
const { askJson } = require("./ai");
const { similaritySearchMulti } = require("../utils/vectorStore");
const { estimateQuestionCapacity } = require("../utils/validators");

const dedupeQuestions = (questions) => {
  const seen = new Set();
  return (questions || []).filter((q) => {
    const key = String(q?.question || "").trim().toLowerCase();
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

const STOPWORDS = new Set([
  "the", "and", "for", "that", "with", "this", "from", "are", "was", "were",
  "have", "has", "had", "you", "your", "be", "is", "in", "on", "at", "to", "of",
  "by", "as", "or", "an", "a", "not", "no", "but", "can", "will", "should", "would",
]);

const CORRUPTED_GLYPH_REGEX = /[\uFFFD\uE000-\uF8FF\uAC00-\uD7AF]|[\u{1D400}-\u{1D7FF}]/u;

const normalizeSpace = (value) =>
  String(value || "")
    .normalize("NFKC")
    .replace(/[\u200B-\u200D\uFEFF]/g, "")
    .replace(/\s+/g, " ")
    .trim();

const hasCorruptedGlyphs = (text) => {
  const value = String(text || "");
  if (!value) return false;
  if (CORRUPTED_GLYPH_REGEX.test(value)) return true;

  const illegalSymbols = (value.match(/[^\x20-\x7E\t\n\r]/g) || []).length;
  const letters = (value.match(/[A-Za-z]/g) || []).length;
  return illegalSymbols >= 3 && illegalSymbols > letters * 0.35;
};

const hasNavigationNoise = (sentence) =>
  /(>>|<<|\bback\b|\bnext\b|\bprevious\b|\bcontents?\b|\bindex\b|\bchapter\s*\d+\b)/i.test(sentence);

const sentenceScore = (sentence) => {
  const clean = normalizeSpace(sentence);
  if (!clean) return -1;
  if (hasCorruptedGlyphs(clean)) return -1;

  const words = clean.split(/\s+/).filter(Boolean);
  if (words.length < 8 || words.length > 45) return -1;

  const alphaChars = (clean.match(/[A-Za-z]/g) || []).length;
  const alphaRatio = alphaChars / Math.max(clean.length, 1);
  if (alphaRatio < 0.6) return -1;

  const normalizedWords = words
    .map((w) => w.toLowerCase().replace(/[^a-z]/g, ""))
    .filter(Boolean);
  const uniqueRatio = new Set(normalizedWords).size / Math.max(normalizedWords.length, 1);
  if (uniqueRatio < 0.45) return -1;

  let score = words.length + uniqueRatio * 20 + alphaRatio * 10;
  if (hasNavigationNoise(clean)) score -= 8;
  return score;
};

const pickHighQualitySentences = (text, limit = 180) => {
  const raw = String(text || "");
  const parts = raw
    .replace(/\r/g, "\n")
    .split(/[.!?]+\s+|\n+/)
    .map((s) => normalizeSpace(s))
    .filter(Boolean);

  const ranked = parts
    .map((sentence) => ({ sentence, score: sentenceScore(sentence) }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score);

  const deduped = [];
  const seen = new Set();
  for (const item of ranked) {
    const key = item.sentence.toLowerCase().replace(/[^a-z0-9\s]/g, "").replace(/\s+/g, " ");
    if (key.length < 40 || seen.has(key)) continue;
    seen.add(key);
    deduped.push(item.sentence);
    if (deduped.length >= limit) break;
  }

  return deduped;
};

const extractCandidateTerms = (sentences) => {
  const terms = [...new Set(
    (sentences || [])
      .flatMap((s) => s.split(/[^A-Za-z]+/))
      .map((w) => w.trim())
      .filter((w) => w.length >= 5 && !STOPWORDS.has(w.toLowerCase()))
  )];
  return terms.slice(0, 300);
};

const pickDistractors = (terms, answerWord, count = 3, seed = 0) => {
  const pool = terms.filter((t) => t.toLowerCase() !== answerWord.toLowerCase());
  const selected = [];
  for (let i = 0; i < pool.length && selected.length < count; i += 1) {
    const idx = (seed + i * 7) % pool.length;
    const candidate = pool[idx];
    if (!selected.some((s) => s.toLowerCase() === candidate.toLowerCase())) {
      selected.push(candidate);
    }
  }
  while (selected.length < count) selected.push("concept");
  return selected;
};

const shuffleOptions = (values, seed = 0) => {
  const arr = [...values];
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = (seed + i * 3) % (i + 1);
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
};

const normalizeQuestion = (q, difficulty) => {
  const question = normalizeSpace(q?.question || "");
  const topic = String(q?.topic || "General").trim() || "General";
  const typeRaw = String(q?.type || "short_answer").toLowerCase();
  const type = ["mcq", "fill_blank", "short_answer"].includes(typeRaw) ? typeRaw : "short_answer";
  const options = Array.isArray(q?.options)
    ? q.options.map((o) => normalizeSpace(o || "")).filter(Boolean).filter((o) => !hasCorruptedGlyphs(o)).slice(0, 6)
    : [];
  let answer = normalizeSpace(q?.answer || "");

  if (hasCorruptedGlyphs(question) || hasCorruptedGlyphs(answer)) return null;

  if (type === "mcq") {
    if (options.length < 2) {
      return null;
    }
    const answerUpper = answer.toUpperCase();
    if (["A", "B", "C", "D"].includes(answerUpper) && options.length >= 4) {
      answer = options[{ A: 0, B: 1, C: 2, D: 3 }[answerUpper]];
    }
    if (!options.some((o) => o.toLowerCase() === answer.toLowerCase())) {
      answer = options[0];
    }
  }

  if (!question || !answer) return null;
  return { question, type, options, answer, difficulty, topic };
};

const fallbackQuiz = (text, count, difficulty) => {
  const sentences = pickHighQualitySentences(text, 180);

  const source = sentences.length ? sentences : ["The document contains important study material."];
  const terms = extractCandidateTerms(source);

  const questions = Array.from({ length: count }).map((_, idx) => {
    const sentence = source[idx % source.length];
    const words = sentence
      .split(/\s+/)
      .map((w) => w.replace(/[^A-Za-z]/g, ""))
      .filter((w) => w.length > 4 && !STOPWORDS.has(w.toLowerCase()));
    const topic = words[0] || "General";

    if (idx % 2 === 0 && words.length >= 3) {
      const answerWord = words[Math.min(1, words.length - 1)];
      const distractors = pickDistractors(terms, answerWord, 3, idx + sentence.length);
      const options = shuffleOptions([answerWord, distractors[0], distractors[1], distractors[2]], idx + count);
      const blankedSentence = sentence.replace(new RegExp(`\\b${answerWord}\\b`, "i"), "____");
      if (hasCorruptedGlyphs(blankedSentence)) {
        return {
          question: `Explain this concept in your own words: ${topic}`,
          type: "short_answer",
          options: [],
          answer: sentence.slice(0, 150),
          difficulty,
          topic,
        };
      }
      return {
        question: `What word best completes this statement? ${blankedSentence}`,
        type: "mcq",
        options,
        answer: answerWord,
        difficulty,
        topic,
      };
    }

    return {
      question: `Explain this concept in your own words: ${topic}`,
      type: "short_answer",
      options: [],
      answer: sentence.slice(0, 150),
      difficulty,
      topic,
    };
  });

  return { questions };
};

const buildQuizContext = async (doc, numQuestions, difficulty) => {
  const keywords = Array.isArray(doc.keywords) ? doc.keywords.slice(0, 12) : [];
  const queries = [
    ...keywords,
    `${difficulty} level key ideas`,
    `${difficulty} conceptual understanding`,
    "definitions and explanations",
    "important facts",
  ];

  const chunks = await similaritySearchMulti(doc._id, queries, {
    perQuery: 4,
    limit: Math.max(8, Math.min(20, numQuestions * 3)),
  });

  if (chunks.length) {
    const cleanedChunkText = pickHighQualitySentences(chunks.join("\n"), Math.max(40, numQuestions * 8));
    if (cleanedChunkText.length) return cleanedChunkText.join(". ");
    return chunks.join("\n\n");
  }

  const cleanedDocText = pickHighQualitySentences(doc.text, Math.max(40, numQuestions * 8));
  if (cleanedDocText.length) return cleanedDocText.join(". ");
  return String(doc.text || "").slice(0, 12000);
};

const generateQuiz = async (payload, user) => {
  const docId = payload.doc_id || "";
  const numQuestions = Number(payload.num_questions || 5);
  const difficulty = String(payload.difficulty || "easy").toLowerCase();

  if (!docId) return [{ error: "doc_id is required" }, 400];
  if (!["easy", "medium", "hard"].includes(difficulty)) {
    return [{ error: "difficulty must be easy, medium, or hard" }, 400];
  }
  if (numQuestions < 1) {
    return [{ error: "num_questions must be at least 1" }, 400];
  }

  const doc = await FileMeta.findOne({ _id: docId, user_id: user._id }).lean();
  if (!doc) return [{ error: "document not found" }, 404];

  const estimatedCapacity = Number(
    doc?.metadata?.question_capacity ||
      estimateQuestionCapacity({
        text: doc.text,
        keywords: doc.keywords,
        chunkCount: doc?.metadata?.chunk_count || 0,
        difficulty,
      })
  );
  if (numQuestions > estimatedCapacity) {
    return [
      {
        error: `This document is too short to generate ${numQuestions} questions. Based on the available content, the maximum suggested number is ${estimatedCapacity}. Please upload a longer document or request fewer questions.`,
        available_questions: estimatedCapacity,
      },
      400,
    ];
  }

  const context = await buildQuizContext(doc, numQuestions, difficulty);

  const prompt = `
You are a quiz engine. Generate exactly ${numQuestions} high-quality questions from the context below.
Difficulty: ${difficulty}
Mix question types: MCQ, Fill in the blank, Short answer.
Rules:
- Questions must be directly answerable from context.
- Avoid duplicate or trivial questions.
- Keep wording clear and exam-like.
- Ignore navigation artifacts, table-of-contents lines, and broken fragments.
- Do not ask from incomplete sentence fragments.
Return strict JSON with key \"questions\" and each question containing keys: question, type, options, answer, difficulty, topic.
Context:\n${String(context || "").slice(0, 14000)}
  `;

  const result = await askJson(prompt, () => fallbackQuiz(context, numQuestions, difficulty));
  let questions = Array.isArray(result.questions) ? result.questions : [];
  questions = questions
    .map((q) => normalizeQuestion(q, difficulty))
    .filter(Boolean);
  questions = dedupeQuestions(questions);

  if (questions.length < numQuestions) {
    const fallback = fallbackQuiz(context, numQuestions, difficulty).questions
      .map((q) => normalizeQuestion(q, difficulty))
      .filter(Boolean);
    questions = dedupeQuestions([...questions, ...fallback]).slice(0, numQuestions);
  } else {
    questions = questions.slice(0, numQuestions);
  }

  return [{ doc_id: docId, questions }, 200];
};

const submitQuiz = async (payload, user) => {
  const docId = payload.doc_id || "";
  const quiz = Array.isArray(payload.quiz) ? payload.quiz : [];
  const answers = Array.isArray(payload.answers) ? payload.answers : [];
  const startedAt = Number(payload.started_at || Date.now() / 1000);

  if (!docId || !quiz.length) return [{ error: "doc_id and quiz are required" }, 400];
  if (quiz.length !== answers.length) {
    return [{ error: "answers count must match quiz questions" }, 400];
  }

  let correct = 0;
  let wrong = 0;
  const mistakeTopics = [];
  const detailed = [];

  quiz.forEach((question, idx) => {
    const submitted = answers[idx];
    const expected = question.answer;
    const isCorrect = String(submitted || "").trim().toLowerCase() === String(expected || "").trim().toLowerCase();
    if (isCorrect) correct += 1;
    else {
      wrong += 1;
      mistakeTopics.push(question.topic || "General");
    }
    detailed.push({
      question: question.question,
      submitted,
      correct_answer: expected,
      is_correct: isCorrect,
      difficulty: question.difficulty,
      topic: question.topic || "General",
    });
  });

  const score = Number(((correct / Math.max(quiz.length, 1)) * 100).toFixed(2));
  const timeTaken = Number((Date.now() / 1000 - startedAt).toFixed(2));

  let feedback = "Good job but review some concepts.";
  let suggestions = "Revise the weak topics and retry in medium mode.";
  if (score > 80) {
    feedback = "Excellent work!";
    suggestions = "Keep practicing with harder quizzes to retain concepts.";
  } else if (score < 50) {
    feedback = "Don't worry! Go through the lesson again.";
    suggestions = "Prepare again, review key points, and retake in easy mode.";
  }

  await QuizAttempt.create({
    user_id: user._id,
    doc_id: docId,
    quiz,
    answers: detailed,
    score,
    correct,
    wrong,
    time_taken: timeTaken,
    mistake_topics: [...new Set(mistakeTopics)].sort(),
  });

  return [
    {
      score,
      correct_answers: correct,
      wrong_answers: wrong,
      feedback,
      suggestions,
      mistake_topics: [...new Set(mistakeTopics)].sort(),
      time_taken: timeTaken,
      detailed_results: detailed,
    },
    200,
  ];
};

module.exports = { generateQuiz, submitQuiz };
