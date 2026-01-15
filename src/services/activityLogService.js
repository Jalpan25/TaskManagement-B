// services/activityLogService.js
const prisma = require("../prisma");
const { ensureProjectAccess } = require("../utils/projectAccess.util");

exports.getTaskActivityLogs = async ({
  taskId,
  userId,
  limit = 20,
  cursor,
}) => {
  // 1️⃣ Fetch task + projectId
  const task = await prisma.task.findUnique({
    where: { id: taskId },
    select: {
      id: true,
      projectId: true,
      title: true,
    },
  });

  if (!task) {
    throw { status: 404, message: "Task not found" };
  }

  // 2️⃣ Ensure user has access to task's project
  await ensureProjectAccess(task.projectId, userId);

  // 3️⃣ Fetch activity logs for this task
  const logs = await prisma.activityLog.findMany({
    where: {
      taskId: taskId,
    },
    orderBy: {
      id: "desc",
    },
    take: limit + 1,
    ...(cursor && {
      cursor: { id: cursor },
      skip: 1,
    }),
    include: {
      createdBy: {
        select: { name: true },
      },
    },
  });

  const hasMore = logs.length > limit;
  const slicedLogs = hasMore ? logs.slice(0, limit) : logs;

const formattedLogs = slicedLogs.map(log => ({
  id: log.id,                 
  type: log.type,
  oldValue: log.oldValue,
  newValue: log.newValue,
  createdAt: log.createdAt,
  createdBy: log.createdBy.name,
}));


  return {
    taskId: task.id,
    taskTitle: task.title,
    logs: formattedLogs,
    nextCursor: hasMore
      ? slicedLogs[slicedLogs.length - 1].id
      : null,
    hasMore,
  };
};
