const router = require("express").Router();
const { authenticate, requireRoles } = require("../middleware/auth");
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
    res.json(await service.getStudentProfile(req.params.id, req.user));
  } catch (error) {
    next(error);
  }
});

router.get("/:id/attendance", authenticate, async (req, res, next) => {
  try {
    res.json(await service.listStudentAttendance(req.params.id, req.user));
  } catch (error) {
    next(error);
  }
});

router.post(
  "/:id/exam-request",
  requireRoles("admin", "staff", "teacher"),
  async (req, res, next) => {
    try {
      res.json(
        await service.raiseStudentForExam(req.params.id, req.body, req.user),
      );
    } catch (error) {
      next(error);
    }
  },
);

router.put("/:id", requireRoles("admin", "staff"), async (req, res, next) => {
  try {
    res.json(await service.updateStudentProfile(req.params.id, req.body));
  } catch (error) {
    next(error);
  }
});

router.delete(
  "/:id",
  requireRoles("admin", "staff"),
  async (req, res, next) => {
    try {
      await service.deleteProfile(
        "students",
        req.params.id,
        "Student not found",
      );
      res.json({ message: "Student deleted successfully" });
    } catch (error) {
      next(error);
    }
  },
);

module.exports = router;
