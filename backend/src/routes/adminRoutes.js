const router = require("express").Router();
const { requireRoles } = require("../middleware/auth");
const admin = require("../services/adminService");

router.delete("/data", requireRoles("admin"), async (req, res, next) => {
  try {
    res.json(await admin.clearAllData());
  } catch (error) {
    next(error);
  }
});

module.exports = router;
