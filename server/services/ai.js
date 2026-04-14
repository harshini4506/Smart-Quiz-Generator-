const OpenAI = require("openai");

const config = require("../config");

const client = config.openAiApiKey ? new OpenAI({ apiKey: config.openAiApiKey }) : null;

const askJson = async (prompt, fallback) => {
  if (!client) return fallback();
  try {
    const response = await client.chat.completions.create({
      model: config.llmModel,
      temperature: 0.3,
      response_format: { type: "json_object" },
      messages: [{ role: "user", content: prompt }],
    });
    const raw = response.choices?.[0]?.message?.content || "{}";
    return JSON.parse(raw);
  } catch (_err) {
    return fallback();
  }
};

const askText = async (prompt, fallback) => {
  if (!client) return fallback();
  try {
    const response = await client.chat.completions.create({
      model: config.llmModel,
      temperature: 0.6,
      messages: [{ role: "user", content: prompt }],
    });
    return response.choices?.[0]?.message?.content?.trim() || fallback();
  } catch (_err) {
    return fallback();
  }
};

module.exports = { askJson, askText };
