// routes/taskActivityLog.routes.js
const express = require("express");
const router = express.Router();
const activityLogController = require("../controllers/activityLogController");
const auth = require("../middleware/auth.middleware");

router.get(
  "/:taskId/activity-logs",
  auth,
  activityLogController.getTaskActivityLogs
);

module.exports = router;
