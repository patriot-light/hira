const router = require("express").Router();
const { requireRoles } = require("../middleware/auth");
const service = require("../services/certificateService");

router.use(requireRoles("admin"));

router.get("/templates", async (req, res, next) => {
  try {
    res.json(await service.listTemplates());
  } catch (error) {
    next(error);
  }
});

router.post("/templates", async (req, res, next) => {
  try {
    res.json(await service.createTemplate(req.body, req.user));
  } catch (error) {
    next(error);
  }
});

router.put("/templates/:id", async (req, res, next) => {
  try {
    res.json(await service.updateTemplate(req.params.id, req.body));
  } catch (error) {
    next(error);
  }
});

router.delete("/templates/:id", async (req, res, next) => {
  try {
    await service.deleteTemplate(req.params.id);
    res.json({ message: "Certificate template deleted successfully" });
  } catch (error) {
    next(error);
  }
});

router.get("/issued", async (req, res, next) => {
  try {
    res.json(await service.listIssuedCertificates());
  } catch (error) {
    next(error);
  }
});

router.post("/issued", async (req, res, next) => {
  try {
    res.json(await service.issueCertificate(req.body, req.user));
  } catch (error) {
    next(error);
  }
});

router.get("/issued/:id/pdf", async (req, res, next) => {
  try {
    const { doc, filename } = await service.renderCertificatePdf(req.params.id);
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    doc.pipe(res);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
