const router = require("express").Router();
const { authenticate, requireRoles } = require("../middleware/auth");
const { getCollection } = require("../config/database");
const service = require("../services/halaqaService");

router.get("/", authenticate, async (req, res, next) => {
  try {
    res.json(await service.listHalaqas(req.user));
  } catch (error) {
    next(error);
  }
});

router.get("/types", authenticate, async (req, res, next) => {
  try {
    res.json(await service.listTypes());
  } catch (error) {
    next(error);
  }
});

router.post("/types", requireRoles("admin", "staff"), async (req, res, next) => {
  try {
    res.json(await service.createType(req.body));
  } catch (error) {
    next(error);
  }
});

router.put("/types/:id", requireRoles("admin", "staff"), async (req, res, next) => {
  try {
    res.json(await service.updateType(req.params.id, req.body));
  } catch (error) {
    next(error);
  }
});

router.delete("/types/:id", requireRoles("admin", "staff"), async (req, res, next) => {
  try {
    await service.deleteType(req.params.id);
    res.json({ message: "Halaqa type deleted successfully" });
  } catch (error) {
    next(error);
  }
});

router.post("/", requireRoles("admin", "staff"), async (req, res, next) => {
  try {
    res.json(await service.create(req.body));
  } catch (error) {
    next(error);
  }
});

router.get("/:id", authenticate, async (req, res, next) => {
  try {
    const halaqa = await getCollection("halaqas").findOne({ id: req.params.id }, { projection: { _id: 0 } });
    if (!halaqa) return res.status(404).json({ detail: "Halaqa not found" });
    res.json(halaqa);
  } catch (error) {
    next(error);
  }
});

router.put("/:id", requireRoles("admin", "staff"), async (req, res, next) => {
  try {
    res.json(await service.update(req.params.id, req.body));
  } catch (error) {
    next(error);
  }
});

router.delete("/:id", requireRoles("admin", "staff"), async (req, res, next) => {
  try {
    await service.remove(req.params.id);
    res.json({ message: "Halaqa deleted successfully" });
  } catch (error) {
    next(error);
  }
});

router.get("/:id/students", authenticate, async (req, res, next) => {
  try {
    const students = await getCollection("students").find({}, { projection: { _id: 0 } }).toArray();
    res.json(students.filter((student) => (student.halaqa_ids || (student.halaqa_id ? [student.halaqa_id] : [])).includes(req.params.id)));
  } catch (error) {
    next(error);
  }
});

router.get("/:id/attendance", authenticate, async (req, res, next) => {
  try {
    res.json(await service.listAttendance(req.params.id, req.user));
  } catch (error) {
    next(error);
  }
});

router.post("/:id/attendance/:studentId/absent", requireRoles("admin", "staff", "teacher"), async (req, res, next) => {
  try {
    res.json(await service.markStudentAbsent(req.params.id, req.params.studentId, req.body, req.user));
  } catch (error) {
    next(error);
  }
});

router.post("/:id/students/:studentId", requireRoles("admin", "staff"), async (req, res, next) => {
  try {
    await service.assignStudent(req.params.id, req.params.studentId);
    res.json({ message: "Student assigned to halaqa successfully" });
  } catch (error) {
    next(error);
  }
});

router.delete("/:id/students/:studentId", requireRoles("admin", "staff"), async (req, res, next) => {
  try {
    await service.removeStudent(req.params.id, req.params.studentId);
    res.json({ message: "Student removed from halaqa successfully" });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
