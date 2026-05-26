const router = require("express").Router();
const { requireRoles } = require("../middleware/auth");
const service = require("../services/certificateService");

router.get(
  "/templates",
  requireRoles("admin", "staff", "teacher", "exam_teacher"),
  async (req, res, next) => {
    try {
      res.json(await service.listTemplates());
    } catch (error) {
      next(error);
    }
  },
);

router.post("/templates", requireRoles("admin"), async (req, res, next) => {
  try {
    res.json(await service.createTemplate(req.body, req.user));
  } catch (error) {
    next(error);
  }
});

router.put("/templates/:id", requireRoles("admin"), async (req, res, next) => {
  try {
    res.json(await service.updateTemplate(req.params.id, req.body));
  } catch (error) {
    next(error);
  }
});

router.delete(
  "/templates/:id",
  requireRoles("admin"),
  async (req, res, next) => {
    try {
      await service.deleteTemplate(req.params.id);
      res.json({ message: "Certificate template deleted successfully" });
    } catch (error) {
      next(error);
    }
  },
);

router.get(
  "/issued",
  requireRoles("admin", "staff", "teacher", "exam_teacher"),
  async (req, res, next) => {
    try {
      res.json(await service.listIssuedCertificates());
    } catch (error) {
      next(error);
    }
  },
);

router.post(
  "/issued",
  requireRoles("admin", "staff", "teacher", "exam_teacher"),
  async (req, res, next) => {
    try {
      res.json(await service.issueCertificate(req.body, req.user));
    } catch (error) {
      next(error);
    }
  },
);

router.get(
  "/issued/:id/pdf",
  requireRoles("admin", "staff", "teacher", "exam_teacher"),
  async (req, res, next) => {
    try {
      const { buffer, filename } = await service.renderCertificatePdf(
        req.params.id,
      );
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${filename}"`,
      );
      res.end(buffer);
    } catch (error) {
      next(error);
    }
  },
);

module.exports = router;
