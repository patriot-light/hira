const router = require("express").Router();
const { authenticate, requireRoles } = require("../middleware/auth");
const { getCollection } = require("../config/database");
const service = require("../services/profileService");

router.get("/", authenticate, async (req, res, next) => {
  try {
    res.json(await getCollection("teachers").find({}, { projection: { _id: 0 } }).toArray());
  } catch (error) {
    next(error);
  }
});

router.post("/", requireRoles("admin", "staff"), async (req, res, next) => {
  try {
    res.json(await service.createTeacherProfile(req.body));
  } catch (error) {
    next(error);
  }
});

router.get("/:id", authenticate, async (req, res, next) => {
  try {
    const teacher = await getCollection("teachers").findOne({ id: req.params.id }, { projection: { _id: 0 } });
    if (!teacher) return res.status(404).json({ detail: "Teacher not found" });
    res.json(teacher);
  } catch (error) {
    next(error);
  }
});

router.put("/:id", requireRoles("admin", "staff"), async (req, res, next) => {
  try {
    res.json(await service.updateTeacherProfile(req.params.id, req.body));
  } catch (error) {
    next(error);
  }
});

router.delete("/:id", requireRoles("admin", "staff"), async (req, res, next) => {
  try {
    await service.deleteProfile("teachers", req.params.id, "Teacher not found");
    res.json({ message: "Teacher deleted successfully" });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
