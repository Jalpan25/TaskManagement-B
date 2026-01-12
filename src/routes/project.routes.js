const express = require("express");
const router = express.Router();

const auth = require("../middleware/auth.middleware");
const isAdmin = require("../middleware/isAdmin.middleware");
const controller = require("../controllers/project.controller");

router.get("/", auth, controller.getProjects);
router.post("/", auth, isAdmin, controller.createProject);


router.get("/:projectId", auth, controller.getProject);
router.put("/:projectId", auth, isAdmin, controller.updateProject);
router.delete("/:projectId", auth, isAdmin, controller.deleteProject);


//INSIDE FORM API FOR GETTING ALL USERS
router.get(
  "/:projectId/members",
  auth,
  controller.getProjectMembers  
);

module.exports = router;
