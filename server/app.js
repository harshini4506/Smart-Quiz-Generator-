const fs = require("fs");
const path = require("path");
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");

const config = require("./config");
const authRouter = require("./routes/auth");
const coreRouter = require("./routes/core");

const app = express();

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

app.use(
  cors({
    origin: (origin, cb) => {
      if (!origin || config.corsOrigins.includes("*") || config.corsOrigins.includes(origin)) {
        return cb(null, true);
      }
      return cb(new Error("Not allowed by CORS"));
    },
  })
);

app.get("/", (_req, res) => {
  res.json({ message: "SMART QUIZ GENERATOR AI API", status: "ok" });
});

app.use("/auth", authRouter);
app.use("/", coreRouter);

app.use((error, _req, res, _next) => {
  if (error && error.message === "Not allowed by CORS") {
    return res.status(403).json({ error: "CORS blocked" });
  }
  if (error && error.code === "LIMIT_FILE_SIZE") {
    return res.status(400).json({ error: `File exceeds ${config.maxUploadMb}MB limit` });
  }
  console.error(error);
  return res.status(500).json({ error: "Internal server error" });
});

const ensureDirs = () => {
  fs.mkdirSync(path.resolve(config.uploadDir), { recursive: true });
  fs.mkdirSync(path.resolve(config.vectorDir), { recursive: true });
};

const isLocalMongoUri = (value) => {
  const uri = String(value || "");
  return uri.includes("127.0.0.1") || uri.includes("localhost");
};

const getMongoHost = (value) => {
  try {
    const uri = new URL(String(value || "").replace(/^mongodb\+srv:/, "https:"));
    return uri.hostname || "unknown-host";
  } catch {
    return "unknown-host";
  }
};

const isLikelyMongoUri = (value) => /^mongodb(\+srv)?:\/\//i.test(String(value || ""));

const start = async () => {
  ensureDirs();

  if (process.env.NODE_ENV === "production") {
    if (!isLikelyMongoUri(config.mongoUri)) {
      throw new Error("MONGO_URI is missing or invalid. Set it in Render to your MongoDB Atlas connection string.");
    }
    if (isLocalMongoUri(config.mongoUri)) {
      throw new Error("MONGO_URI is still pointing to a local MongoDB address. Set the Render environment variable to your MongoDB Atlas connection string.");
    }
  }

  try {
    await mongoose.connect(config.mongoUri);
  } catch (error) {
    const host = getMongoHost(config.mongoUri);
    throw new Error(`Failed to connect to MongoDB host '${host}'. Update Render MONGO_URI to the correct MongoDB Atlas string.`);
  }
  app.listen(config.port, () => {
    console.log(`Server running on http://localhost:${config.port}`);
  });
};

start().catch((err) => {
  console.error("Failed to start server", err);
  process.exit(1);
});

module.exports = app;
