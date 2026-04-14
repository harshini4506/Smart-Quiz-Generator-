const fs = require("fs");
const path = require("path");
const JSZip = require("jszip");
const pdfParse = require("pdf-parse");

const xmlToText = (xml) =>
  String(xml || "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();

const extractDocxText = async (buffer) => {
  const zip = await JSZip.loadAsync(buffer);
  const docXml = zip.file("word/document.xml");
  if (!docXml) return "";
  const xml = await docXml.async("string");
  return xmlToText(xml);
};

const extractPptxText = async (buffer) => {
  const zip = await JSZip.loadAsync(buffer);
  const slideFiles = Object.keys(zip.files)
    .filter((name) => /^ppt\/slides\/slide\d+\.xml$/.test(name))
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));

  const chunks = [];
  for (const file of slideFiles) {
    const xml = await zip.file(file).async("string");
    chunks.push(xmlToText(xml));
  }
  return chunks.join("\n");
};

const extractTextFromFile = async (savedPath, originalName) => {
  const ext = path.extname(originalName || savedPath).toLowerCase();

  if (ext === ".txt") {
    return fs.readFileSync(savedPath, "utf-8");
  }

  const buffer = fs.readFileSync(savedPath);

  if (ext === ".pdf") {
    const data = await pdfParse(buffer);
    return data.text || "";
  }

  if (ext === ".docx") {
    return extractDocxText(buffer);
  }

  if (ext === ".pptx") {
    return extractPptxText(buffer);
  }

  if (ext === ".ppt") {
    return "";
  }

  return "";
};

module.exports = { extractTextFromFile };
