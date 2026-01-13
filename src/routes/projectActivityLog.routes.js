const express = require("express");
const router = express.Router();
const activityLogController=require("../controllers/activityLogController")
const auth = require("../middleware/auth.middleware");

router.get(
  "/:projectId/activity-logs",
  auth,
  activityLogController.getProjectActivityLogs
);

module.exports = router;
