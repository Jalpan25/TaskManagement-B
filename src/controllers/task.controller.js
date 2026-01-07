const taskService = require("../services/task.service");

exports.createTask = async (req, res) => {
  try {
    const task = await taskService.createTask({
      projectId: Number(req.params.projectId),
      userId: req.user.id,
      data: req.body,
    });

    res.status(201).json(task);
  } catch (error) {
    res.status(error.status || 500).json({
      message: error.message || "Failed to create task",
    });
  }
};

exports.getProjectTasks = async (req, res) => {
  try {
    const tasks = await taskService.getProjectTasks({
      projectId: Number(req.params.projectId),
      userId: req.user.id,
    });

    res.status(200).json(tasks);
  } catch (error) {
    res.status(error.status || 500).json({
      message: error.message || "Failed to fetch tasks",
    });
  }
};

exports.updateTask = async (req, res) => {
  try {
    const task = await taskService.updateTask({
      taskId: Number(req.params.taskId),
      userId: req.user.id,
      data: req.body,
    });

    res.status(200).json(task);
  } catch (error) {
    res.status(error.status || 500).json({
      message: error.message || "Failed to update task",
    });
  }
};

exports.deleteTask = async (req, res) => {
  try {
    await taskService.deleteTask({
      taskId: Number(req.params.taskId),
      userId: req.user.id,
    });

    res.status(200).json({ message: "Task deleted" });
  } catch (error) {
    res.status(error.status || 500).json({
      message: error.message || "Failed to delete task",
    });
  }
};
