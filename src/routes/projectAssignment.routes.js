const express = require("express");
const router = express.Router();

const auth = require("../middleware/auth.middleware");
const controller = require("../controllers/projectAssignment.controller");
const isAdminMiddleware = require("../middleware/isAdmin.middleware");

router.get("/:projectId/members", auth, controller.getMembers);
router.post("/:projectId/members", auth, controller.addMembers);
router.delete("/:projectId/members/:userId", auth, controller.removeMember);

//assigned and not-assigned users
router.get(
  "/:projectId/available-users",
  auth,
  isAdminMiddleware,
  controller.getAvailableUsers
);


module.exports = router;
