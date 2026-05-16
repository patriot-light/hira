const router = require("express").Router();
const { authenticate } = require("../middleware/auth");
const reports = require("../services/reportService");

router.get("/dashboard", authenticate, async (req, res, next) => {
  try {
    res.json(await reports.dashboard());
  } catch (error) {
    next(error);
  }
});

router.get("/student/:id", authenticate, async (req, res, next) => {
  try {
    res.json(await reports.studentReport(req.params.id));
  } catch (error) {
    next(error);
  }
});

router.get("/halaqa/:id", authenticate, async (req, res, next) => {
  try {
    res.json(await reports.halaqaReport(req.params.id));
  } catch (error) {
    next(error);
  }
});

router.get("/teacher/:id", authenticate, async (req, res, next) => {
  try {
    res.json(await reports.teacherReport(req.params.id));
  } catch (error) {
    next(error);
  }
});

module.exports = router;
