const router = require("express").Router();
const { authenticate, requireRoles } = require("../middleware/auth");
const { getCollection } = require("../config/database");
const service = require("../services/profileService");

router.get("/", authenticate, async (req, res, next) => {
  try {
    res.json(await service.listStudents(req.user));
  } catch (error) {
    next(error);
  }
});

router.post("/", requireRoles("admin", "staff"), async (req, res, next) => {
  try {
    res.json(await service.createStudentProfile(req.body));
  } catch (error) {
    next(error);
  }
});

router.get("/:id", authenticate, async (req, res, next) => {
  try {
    const student = await getCollection("students").findOne({ id: req.params.id }, { projection: { _id: 0 } });
    if (!student) return res.status(404).json({ detail: "Student not found" });
    res.json(student);
  } catch (error) {
    next(error);
  }
});

router.put("/:id", requireRoles("admin", "staff"), async (req, res, next) => {
  try {
    res.json(await service.updateStudentProfile(req.params.id, req.body));
  } catch (error) {
    next(error);
  }
});

router.delete("/:id", requireRoles("admin", "staff"), async (req, res, next) => {
  try {
    await service.deleteProfile("students", req.params.id, "Student not found");
    res.json({ message: "Student deleted successfully" });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
