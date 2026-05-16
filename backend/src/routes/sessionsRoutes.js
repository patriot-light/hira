const router = require("express").Router();
const { authenticate, requireRoles } = require("../middleware/auth");
const { getCollection } = require("../config/database");
const service = require("../services/sessionService");

router.get("/", authenticate, async (req, res, next) => {
  try {
    res.json(await service.listSessions(req.user, req.query.student_id));
  } catch (error) {
    next(error);
  }
});

router.post("/", requireRoles("admin", "staff", "teacher"), async (req, res, next) => {
  try {
    res.json(await service.create(req.body, req.user));
  } catch (error) {
    next(error);
  }
});

router.get("/:id", authenticate, async (req, res, next) => {
  try {
    const session = await getCollection("recitation_sessions").findOne({ id: req.params.id }, { projection: { _id: 0 } });
    if (!session) return res.status(404).json({ detail: "Session not found" });
    res.json(session);
  } catch (error) {
    next(error);
  }
});

router.delete("/:id", requireRoles("admin", "staff", "teacher"), async (req, res, next) => {
  try {
    await service.remove(req.params.id);
    res.json({ message: "Session deleted successfully" });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
