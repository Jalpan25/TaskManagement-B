const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth.middleware");
const controller = require("../controllers/task.controller");

router.post("/projects/:projectId/tasks", auth, controller.createTask);
router.get("/projects/:projectId/tasks", auth, controller.getProjectTasks);
router.put("/tasks/:taskId", auth, controller.updateTask);
router.delete("/tasks/:taskId", auth, controller.deleteTask);

module.exports = router;
