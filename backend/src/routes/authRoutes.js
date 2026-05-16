const router = require("express").Router();
const { authenticate } = require("../middleware/auth");
const { publicUser } = require("../models");
const auth = require("../services/authService");

router.post("/register", async (req, res, next) => {
  try {
    res.json(await auth.register(req.body));
  } catch (error) {
    next(error);
  }
});

router.post("/login", async (req, res, next) => {
  try {
    res.json(await auth.login(req.body));
  } catch (error) {
    next(error);
  }
});

router.get("/me", authenticate, (req, res) => res.json(publicUser(req.user)));

module.exports = router;
