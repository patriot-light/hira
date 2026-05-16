const router = require("express").Router();
const { requireRoles } = require("../middleware/auth");
const { getCollection } = require("../config/database");
const service = require("../services/profileService");

router.get("/", requireRoles("admin"), async (req, res, next) => {
  try {
    res.json(await getCollection("staff").find({}, { projection: { _id: 0 } }).toArray());
  } catch (error) {
    next(error);
  }
});

router.post("/", requireRoles("admin"), async (req, res, next) => {
  try {
    res.json(await service.createStaffProfile(req.body));
  } catch (error) {
    next(error);
  }
});

router.put("/:id", requireRoles("admin"), async (req, res, next) => {
  try {
    res.json(await service.updateStaffProfile(req.params.id, req.body));
  } catch (error) {
    next(error);
  }
});

router.delete("/:id", requireRoles("admin"), async (req, res, next) => {
  try {
    await service.deleteProfile("staff", req.params.id, "Staff not found");
    res.json({ message: "Staff deleted successfully" });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
