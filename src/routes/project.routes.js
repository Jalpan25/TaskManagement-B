const express = require("express");
const router = express.Router();

const auth = require("../middleware/auth.middleware");
const isAdmin = require("../middleware/isAdmin.middleware");
const controller = require("../controllers/project.controller");

router.post("/", auth, isAdmin, controller.createProject);
router.put("/:projectId", auth, isAdmin, controller.updateProject);
router.get("/:projectId", auth, controller.getProject);
router.get("/", auth, controller.getProjects);
router.delete("/:projectId", auth, isAdmin, controller.deleteProject);

module.exports = router;
