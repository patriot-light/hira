const router = require("express").Router();
const { requireRoles } = require("../middleware/auth");
const users = require("../services/profileService");

router.get("/", requireRoles("admin"), async (req, res, next) => {
  try {
    res.json(await users.listUsers());
  } catch (error) {
    next(error);
  }
});

router.put("/:userId/role", requireRoles("admin"), async (req, res, next) => {
  try {
    await users.updateUserRole(req.params.userId, req.body?.role || req.query.role);
    res.json({ message: "Role updated successfully" });
  } catch (error) {
    next(error);
  }
});

router.delete("/:userId", requireRoles("admin"), async (req, res, next) => {
  try {
    await users.deleteUser(req.params.userId);
    res.json({ message: "User deleted successfully" });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
