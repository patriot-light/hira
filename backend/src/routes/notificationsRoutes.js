const router = require("express").Router();
const { authenticate } = require("../middleware/auth");
const { getCollection } = require("../config/database");

router.get("/", authenticate, async (req, res, next) => {
  try {
    if (req.user.role !== "admin") return res.json([]);
    const notifications = await getCollection("notifications")
      .find({ audience: "admin", dismissed: { $ne: true } }, { projection: { _id: 0 } })
      .sort({ created_at: -1 })
      .limit(20)
      .toArray();
    res.json(notifications);
  } catch (error) {
    next(error);
  }
});

router.put("/read-all", authenticate, async (req, res, next) => {
  try {
    if (req.user.role !== "admin") return res.status(403).json({ detail: "Insufficient permissions" });
    await getCollection("notifications").updateMany({ audience: "admin" }, { $set: { read: true } });
    res.json({ message: "Notifications marked as read" });
  } catch (error) {
    next(error);
  }
});

router.put("/:id/dismiss", authenticate, async (req, res, next) => {
  try {
    if (req.user.role !== "admin") return res.status(403).json({ detail: "Insufficient permissions" });
    await getCollection("notifications").updateOne({ id: req.params.id, audience: "admin" }, { $set: { dismissed: true, read: true } });
    res.json({ message: "Notification dismissed" });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
