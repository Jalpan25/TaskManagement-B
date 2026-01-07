const prisma = require("../prisma");
const { ensureProjectAccess } = require("../utils/projectAccess.util");

const VALID_PRIORITIES = ["LOW", "MEDIUM", "HIGH"];
const VALID_STATUSES = ["TODO", "IN_PROGRESS", "UNDER_REVIEW", "DONE"];

/* CREATE TASK */
exports.createTask = async ({ projectId, userId, data }) => {
  await ensureProjectAccess(projectId, userId);

  const { title, description, priority, status, dueDate } = data;

  //  Title validation
  if (!title || title.trim() === "") {
    throw { status: 400, message: "Task title is required" };
  }

  //  Priority validation
  if (!priority || !VALID_PRIORITIES.includes(priority)) {
    throw {
      status: 400,
      message: "Priority must be LOW, MEDIUM, or HIGH",
    };
  }

  //  Status validation (optional)
  if (status && !VALID_STATUSES.includes(status)) {
    throw {
      status: 400,
      message: "Invalid task status",
    };
  }

  //  Description validation (optional)
  if (description !== undefined && description.trim() === "") {
    throw {
      status: 400,
      message: "Description cannot be empty",
    };
  }

  //  Due date validation (optional)
  if (dueDate) {
    const parsedDate = new Date(dueDate);

    if (isNaN(parsedDate.getTime())) {
      throw {
        status: 400,
        message: "Invalid due date",
      };
    }

    if (parsedDate < new Date()) {
      throw {
        status: 400,
        message: "Due date must be in the future",
      };
    }
  }

  // ✅ Create task
  return prisma.task.create({
    data: {
      title: title.trim(),
      description: description?.trim(),
      priority,
      status: status || "TODO",
      dueDate: dueDate ? new Date(dueDate) : null,
      projectId,
      createdById: userId,
    },
  });
};

/* GET PROJECT TASKS */
exports.getProjectTasks = async ({ projectId, userId }) => {
  await ensureProjectAccess(projectId, userId);

  return prisma.task.findMany({
    where: {
      projectId,
      isDeleted: false,
    },
    orderBy: { createdAt: "desc" },
  });
};

/* UPDATE TASK */
exports.updateTask = async ({ taskId, userId, data }) => {
  const task = await prisma.task.findUnique({
    where: { id: taskId },
  });

  if (!task || task.isDeleted) {
    throw { status: 404, message: "Task not found" };
  }

  await ensureProjectAccess(task.projectId, userId);

  // const VALID_STATUSES = [
  //   "TODO",
  //   "IN_PROGRESS",
  //   "UNDER_REVIEW",
  //   "DONE",
  // ];

  if (data.status && !VALID_STATUSES.includes(data.status)) {
    throw { status: 400, message: "Invalid task status" };
  }

  return prisma.task.update({
    where: { id: taskId },
    data: {
      ...(data.title && { title: data.title.trim() }),
      ...(data.priority && { priority: data.priority }),
      ...(data.status && { status: data.status }),
    },
  });
};


/* SOFT DELETE TASK */
exports.deleteTask = async ({ taskId, userId }) => {
  const task = await prisma.task.findFirst({
    where: {
      id: taskId,
      isDeleted: false,
    },
  });

  if (!task) {
    throw { status: 404, message: "Task not found" };
  }

  await ensureProjectAccess(task.projectId, userId);

  return prisma.task.update({
    where: { id: taskId },
    data: {
      isDeleted: true,
      deletedAt: new Date(),
    },
  });
};
