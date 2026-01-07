const express = require("express");
const router = express.Router();

const auth = require("../middleware/auth.middleware");
const controller = require("../controllers/projectAssignment.controller");

router.post("/:projectId/members", auth, controller.addMembers);
router.get("/:projectId/members", auth, controller.getMembers);
router.delete("/:projectId/members/:userId", auth, controller.removeMember);
router.get(
  "/:projectId/available-users",
  auth,
  controller.getAvailableUsers
);


module.exports = router;
