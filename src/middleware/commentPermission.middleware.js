const prisma = require("../prisma");

module.exports = async (req, res, next) => {
  try {
    const userId = req.user.id;

    // taslid is inside param or body
    const taskId =
      Number(req.params.taskId) ||
      Number(req.body.taskId);

    if (!taskId || isNaN(taskId)) {
      return res.status(400).json({ message: "Invalid taskId" });
    }

    //  Fetch task + project
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      select: {
        id: true,
        projectId: true,
        isDeleted: true,
      },
    });

    if (!task || task.isDeleted) {
      return res.status(404).json({ message: "Task not found" });
    }

    //  Check project membership
    const isProjectMember = await prisma.projectMember.findUnique({
      where: {
        projectId_userId: {
          projectId: task.projectId,
          userId,
        },
      },
    });

    if (!isProjectMember) {
      return res
        .status(403)
        .json({ message: "You are not a member of this project" });
    }

    //  Check task assignment
    const isTaskAssignee = await prisma.taskAssignee.findUnique({
      where: {
        taskId_userId: {
          taskId: task.id,
          userId,
        },
      },
    });

    if (!isTaskAssignee) {
      return res
        .status(403)
        .json({ message: "You are not assigned to this task" });
    }

    // attach task for later use (optional)
    req.task = task;

    next();
  } catch (error) {
    console.error("Comment permission error:", error);
    return res.status(500).json({ message: "Permission check failed" });
  }
};
