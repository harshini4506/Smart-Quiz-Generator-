const express = require("express");

const { signupUser, loginUser } = require("../services/authService");

const router = express.Router();

router.post("/signup", async (req, res, next) => {
  try {
    const [result, status] = await signupUser(req.body || {});
    res.status(status).json(result);
  } catch (error) {
    next(error);
  }
});

router.post("/login", async (req, res, next) => {
  try {
    const [result, status] = await loginUser(req.body || {});
    res.status(status).json(result);
  } catch (error) {
    next(error);
  }
});

router.post("/logout", (_req, res) => {
  res.status(200).json({ message: "Logout successful. Remove token on client." });
});

module.exports = router;
