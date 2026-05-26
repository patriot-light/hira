const router = require("express").Router();
const { authenticate, requireRoles } = require("../middleware/auth");
const exportsService = require("../services/exportService");

router.get(
  "/students/excel",
  requireRoles("admin", "staff"),
  async (req, res, next) => {
    try {
      const buffer = await exportsService.studentsExcel();
      res.setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      );
      res.setHeader(
        "Content-Disposition",
        "attachment; filename=students.xlsx",
      );
      res.send(buffer);
    } catch (error) {
      next(error);
    }
  },
);

router.get(
  "/students/pdf",
  requireRoles("admin", "staff"),
  async (req, res, next) => {
    try {
      const buffer = await exportsService.studentsPdf();
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", "attachment; filename=students.pdf");
      res.send(buffer);
    } catch (error) {
      next(error);
    }
  },
);

router.get("/report/:studentId/pdf", authenticate, async (req, res, next) => {
  try {
    const buffer = await exportsService.studentReportPdf(req.params.studentId);
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=student_report_${req.params.studentId}.pdf`,
    );
    res.send(buffer);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
