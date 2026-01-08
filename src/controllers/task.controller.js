const taskService = require("../services/task.service");

exports.createTask = async (req, res) => {
  try {
    const task = await taskService.createTask({
      projectId: Number(req.params.projectId),
      userId: req.user.id,
      data: req.body,
    });

    res.status(201).json({
  message: "Task created successfully",
  task,
});

  } catch (error) {
    res.status(error.status || 500).json({
      message: error.message || "Failed to create task",
    });
  }
};


/////////pagination on task 
exports.getProjectTasks = async (req, res) => {
  try {
    const result = await taskService.getProjectTasks({
      projectId: Number(req.params.projectId),
      userId: req.user.id,

      page: Math.max(1, Number(req.query.page) || 1),
      limit: Math.min(50, Number(req.query.limit) || 10), //prevent heavy query

      search: req.query.search?.trim(),
      status: req.query.status,
      priority: req.query.priority,
    });

    res.status(200).json(result);
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

    res.status(200).json({
      message: "Task updated successfully",
      task,
    });
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

exports.getTaskForEdit = async (req, res) => {
  try {
    const data = await taskService.getTaskForEdit({
      taskId: Number(req.params.taskId),
      userId: req.user.id,
    });

    res.status(200).json(data);
  } catch (error) {
    res.status(error.status || 500).json({
      message: error.message || "Failed to load task",
    });
  }
};

