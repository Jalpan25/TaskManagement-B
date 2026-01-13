const prisma = require("../prisma");
const { ensureProjectAccess } = require("../utils/projectAccess.util");
exports.getProjectActivityLogs = async ({
  projectId,
  userId,
  limit = 20,
  cursor,
}) => {
  const logs = await prisma.activityLog.findMany({
    where: {//only log task which belongs to these project
      task: {
        projectId: Number(projectId),
      },
    },
    orderBy: {
      id: "desc",
    },
    take: limit + 1,//fetch extra record to detect hasMore
    ...(cursor && {           //// cursor==last record from previous page
      cursor: { id: Number(cursor) },
      skip: 1,
    }),
    include: {
      createdBy: {
        select: { name: true },
      },
      task: {
        select: { title: true },
      },
    },
  });


  //i need projectId,userid here
  ensureProjectAccess(Number(projectId),userId);

  const hasMore = logs.length > limit;
  const slicedLogs = hasMore ? logs.slice(0, limit) : logs;

  //sending only details which is neccessary
  const formattedLogs = slicedLogs.map(log => ({
    type: log.type,
    oldValue: log.oldValue,
    newValue: log.newValue,
    createdAt: log.createdAt,
    createdBy: log.createdBy.name,
    taskTitle: log.task.title,
  }));

  return {
    logs: formattedLogs,
    nextCursor: hasMore
      ? slicedLogs[slicedLogs.length - 1].id
      : null,
    hasMore,
  };
};

