const router = require("express").Router();
const { authenticate, requireRoles } = require("../middleware/auth");
const service = require("../services/evaluationService");

router.get("/", authenticate, async (req, res, next) => {
  try {
    res.json(await service.listErrorTypes());
  } catch (error) {
    next(error);
  }
});

router.post(
  "/",
  requireRoles("admin", "staff", "teacher"),
  async (req, res, next) => {
    try {
      res.json(await service.createErrorType(req.body));
    } catch (error) {
      next(error);
    }
  },
);

router.put(
  "/:id",
  requireRoles("admin", "staff", "teacher"),
  async (req, res, next) => {
    try {
      res.json(await service.updateErrorType(req.params.id, req.body));
    } catch (error) {
      next(error);
    }
  },
);

router.delete(
  "/:id",
  requireRoles("admin", "staff", "teacher"),
  async (req, res, next) => {
    try {
      await service.deleteErrorType(req.params.id);
      res.json({ message: "Error type deleted successfully" });
    } catch (error) {
      next(error);
    }
  },
);

module.exports = router;
