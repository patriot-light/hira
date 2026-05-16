const router = require("express").Router();
const { authenticate, requireRoles } = require("../middleware/auth");
const service = require("../services/evaluationService");

router.get("/error-types", authenticate, async (req, res, next) => {
  try {
    res.json(await service.listErrorTypes());
  } catch (error) {
    next(error);
  }
});

router.post("/error-types", requireRoles("admin", "staff", "teacher"), async (req, res, next) => {
  try {
    res.json(await service.createErrorType(req.body));
  } catch (error) {
    next(error);
  }
});

router.put("/error-types/:id", requireRoles("admin", "staff", "teacher"), async (req, res, next) => {
  try {
    res.json(await service.updateErrorType(req.params.id, req.body));
  } catch (error) {
    next(error);
  }
});

router.delete("/error-types/:id", requireRoles("admin", "staff", "teacher"), async (req, res, next) => {
  try {
    await service.deleteErrorType(req.params.id);
    res.json({ message: "Error type deleted successfully" });
  } catch (error) {
    next(error);
  }
});

router.get("/exams", authenticate, async (req, res, next) => {
  try {
    res.json(await service.listExamEvaluations(req.user, req.query.student_id));
  } catch (error) {
    next(error);
  }
});

router.post("/exams", requireRoles("admin", "staff", "teacher"), async (req, res, next) => {
  try {
    res.json(await service.createExam(req.body, req.user));
  } catch (error) {
    next(error);
  }
});

router.get("/exams/:id", authenticate, async (req, res, next) => {
  try {
    res.json(await service.getExamEvaluation(req.params.id, req.user));
  } catch (error) {
    next(error);
  }
});

router.delete("/exams/:id", requireRoles("admin", "staff", "teacher"), async (req, res, next) => {
  try {
    await service.remove("exam_evaluations", req.params.id);
    res.json({ message: "Evaluation deleted successfully" });
  } catch (error) {
    next(error);
  }
});

router.get("/pages", authenticate, async (req, res, next) => {
  try {
    res.json(await service.listPageEvaluations(req.user, req.query.student_id));
  } catch (error) {
    next(error);
  }
});

router.post("/pages", requireRoles("admin", "staff", "teacher"), async (req, res, next) => {
  try {
    res.json(await service.createPage(req.body, req.user));
  } catch (error) {
    next(error);
  }
});

router.delete("/pages/:id", requireRoles("admin", "staff", "teacher"), async (req, res, next) => {
  try {
    await service.remove("page_evaluations", req.params.id);
    res.json({ message: "Evaluation deleted successfully" });
  } catch (error) {
    next(error);
  }
});

router.get("/juz", authenticate, async (req, res, next) => {
  try {
    res.json(await service.listJuzEvaluations(req.user, req.query.student_id));
  } catch (error) {
    next(error);
  }
});

router.post("/juz", requireRoles("admin", "staff", "teacher"), async (req, res, next) => {
  try {
    res.json(await service.createJuz(req.body, req.user));
  } catch (error) {
    next(error);
  }
});

router.delete("/juz/:id", requireRoles("admin", "staff", "teacher"), async (req, res, next) => {
  try {
    await service.remove("juz_evaluations", req.params.id);
    res.json({ message: "Evaluation deleted successfully" });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
