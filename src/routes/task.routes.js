const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth.middleware");
const controller = require("../controllers/task.controller");

// Create task
router.post("/projects/:projectId/tasks", auth, controller.createTask);

// Get all tasks of project
router.get("/projects/:projectId/tasks", auth, controller.getProjectTasks);

// 🔹 Get task data for edit screen
router.get("/tasks/:taskId/edit", auth, controller.getTaskForEdit);

// 🔹 Update task (actual update)
router.patch("/tasks/:taskId", auth, controller.updateTask);

// Delete task
router.delete("/tasks/:taskId", auth, controller.deleteTask);


module.exports = router;
