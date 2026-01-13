const prisma = require("../prisma");
const { ensureProjectAccess } = require("../utils/projectAccess.util");

const {VALID_STATUSES,VALID_PRIORITIES,VALID_ACTIVITY_TYPER} =require("../constants/constant");
const { ActivityType } = require("@prisma/client");

///////////////////////////////////////////////////////////////////* CREATE TASK */
exports.createTask = async ({ projectId, userId, data }) => {

  if (!Number.isInteger(projectId)) {
 throw { status: 404, message: "Invalid Project Id" };
}
  await ensureProjectAccess(projectId, userId);

  const { title, description, priority, status, dueDate, assigneeIds } = data;
 

  //  Title validation
  if (!title || title.trim() === "") {
    throw { status: 400, message: "Task title is required" };
  }

  //title length is not too long
  if (title.length > 200) {
  throw { status: 400, message: "Title too long" };
}
//desc too long not allowed


if (description && description.length > 2000) {
  throw { status: 400, message: "Description too long" };
}

///if some write multiple assign which is not exists so here db call happen with IN type so these check
if (assigneeIds.length > 20) {
  throw { status: 400, message: "Too many assignees" };
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


  //validation for assignes
  // Assignee validation (optional)
if (assigneeIds !== undefined) {
  if (!Array.isArray(assigneeIds)) {
    throw { status: 400, message: "assigneeIds must be an array" };
  }

  if (assigneeIds.length === 0) {
    throw { status: 400, message: "assigneeIds cannot be empty array" };
  }

  const uniqueIds = [...new Set(assigneeIds)];

  if (uniqueIds.some((id) => typeof id !== "number")) {
    throw { status: 400, message: "assigneeIds must contain numbers only" };
  }

  // check assignees are project members
  const members = await prisma.projectMember.findMany({
    where: {
      projectId,
      userId: { in: uniqueIds },
    },
    select: { userId: true },
  });

  if (members.length !== uniqueIds.length) {
    throw {
      status: 400,
      message: "One or more assignees are not project members",
    };
  }
}


  // ✅ Create task
return prisma.$transaction(async (tx) => {
  const task = await tx.task.create({
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

  if (assigneeIds?.length) {
    const uniqueIds = [...new Set(assigneeIds)];

    const existingAssignments = await tx.taskAssignee.findMany({
      where: {
        taskId: task.id,
        userId: { in: uniqueIds },
      },
      select: { userId: true },
    });

    if (existingAssignments.length > 0) {
      throw {
        status: 400,
        message: `Users already assigned to task: ${existingAssignments
          .map(a => a.userId)
          .join(", ")}`,
      };
    }

      
  await tx.activityLog.create({
    data: {
      taskId: task.id,
      type: ActivityType.TASK_CREATED,
      oldValue: null,
      newValue: null,
      createdById: userId,
    },
  });

    await tx.taskAssignee.createMany({
      data: uniqueIds.map((uid) => ({
        taskId: task.id,
        userId: uid,
      })),
    });
  }

  return task;
});


};///////////////create task ended


///for edit task we need mebers which is assigned to task or not


//////////////////////////////////////////////////////////////////////////* GET PROJECT TASKS */
exports.getProjectTasks = async ({
  projectId,
  userId,
  page = 1,
  limit = 10,
  search,
  status,
  priority,
}) => {

 // const projectId = Number(req.params.projectId);

if (!Number.isInteger(projectId)) {
 throw { status: 404, message: "Invalid Project Id" };
}

//if some one add like 99999999999999
if (page > 1000) {
  throw { status: 400, message: "Page limit exceeded" };
}

//?search=aaaaaaaaaaaaaaaaaaaaaaa...(100k chars)
if (search && search.length > 100) {
  throw { status: 400, message: "Search term too long" };
}

if (status && !VALID_STATUSES.includes(status)) {
  throw { status: 400, message: "Invalid status" };
}



  await ensureProjectAccess(projectId, userId);

  const skip = (page - 1) * limit;

  // Base condition (always applied)
  const where = {
    projectId,
    isDeleted: false,
  };

  // Search (title)
if (search) {
  where.title = {
    contains: search,    //it is like these===>WHERE title ILIKE '%search%'
    mode: "insensitive",   //case allowed upper and lower
  };
}

  // Status filter
  if (status) {
    where.status = status;
  }

  // Priority filter
  if (priority) {
    where.priority = priority;
  }

  const [tasks, total] = await prisma.$transaction([
    prisma.task.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),////count total number of tasks
    prisma.task.count({
      where,
    }),
  ]);

  return {
    data: tasks,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      hasNextPage: page * limit < total,
      hasPrevPage: page > 1,
    },
  };
};



///update task  

exports.updateTask = async ({ taskId, userId, data }) => {
  if (!Number.isInteger(taskId)) {
    throw { status: 400, message: "Invalid taskId" };
  }

  const task = await prisma.task.findUnique({
    where: { id: taskId },
  });

  if (!task || task.isDeleted) {
    throw { status: 404, message: "Task not found" };
  }

  await ensureProjectAccess(task.projectId, userId);

  const {
    title,
    description,
    status,
    priority,
    dueDate,
    addAssigneeIds,
    removeAssigneeIds,
  } = data;


  if (status && !VALID_STATUSES.includes(status)) {
    throw { status: 400, message: "Invalid task status" };
  }

  if (dueDate) {
    const parsedDate = new Date(dueDate);
    if (isNaN(parsedDate.getTime())) {
      throw { status: 400, message: "Invalid due date" };
    }
    if (parsedDate < new Date()) {
      throw { status: 400, message: "Due date must be in the future" };
    }
  }

  const MAX_ASSIGNEES = 20;
  if (addAssigneeIds?.length > MAX_ASSIGNEES) {
    throw { status: 400, message: "Too many assignees" };
  }

  const STATUS_ORDER = {
    TODO: 1,
    IN_PROGRESS: 2,
    UNDER_REVIEW: 3,
    DONE: 4,
  };

  if (status && status !== task.status) {
    const currentOrder = STATUS_ORDER[task.status];
    const nextOrder = STATUS_ORDER[status];

    if (!nextOrder) {
      throw { status: 400, message: "Invalid task status" };
    }

    if (nextOrder < currentOrder) {
      throw {
        status: 400,
        message: `Cannot revert task status from ${task.status} to ${status}`,
      };
    }

    if (nextOrder === currentOrder) {
      throw {
        status: 400,
        message: "Task is already in this status",
      };
    }
  }


  const oldTitle = task.title;
  const oldDescription = task.description;
  const oldStatus = task.status;
  const oldDueDate = task.dueDate;
  const oldPriority = task.priority;


  //getting assigned names from ID because to store name in log
  const allAssigneeIds = [
  ...(addAssigneeIds || []),
  ...(removeAssigneeIds || []),
];

let assigneeMap = {};

if (allAssigneeIds.length) {
  const users = await prisma.user.findMany({
    where: { id: { in: allAssigneeIds } },
    select: { id: true, name: true },
  });

  assigneeMap = users.reduce((acc, user) => {
    acc[user.id] = user.name;
    return acc;
  }, {});
}

  return prisma.$transaction(async (tx) => {
    const updatedTask = await tx.task.update({
      where: { id: taskId },
      data: {
        ...(title && { title: title.trim() }),
        ...(description !== undefined && { description }),
        ...(status && { status }),
        ...(priority && { priority }),
        ...(dueDate && { dueDate: new Date(dueDate) }),
      },
    });

    if (addAssigneeIds?.length) {
      await tx.taskAssignee.createMany({
        data: addAssigneeIds.map((uid) => ({
          taskId,
          userId: uid,
        })),
        skipDuplicates: true,
      });
    }

    if (removeAssigneeIds?.length) {
      await tx.taskAssignee.deleteMany({
        where: {
          taskId,
          userId: { in: removeAssigneeIds },
        },
      });
    }


    // TITLE CHANGE
    if (title && title.trim() !== oldTitle) {
      await tx.activityLog.create({
        data: {
          taskId,
          type: ActivityType.TITLE_CHANGE,
          oldValue: oldTitle,
          newValue: title.trim(),
          createdById: userId,
        },
      });
    }

    // DESCRIPTION CHANGE
    if (
      description !== undefined &&
      description !== oldDescription
    ) {
      await tx.activityLog.create({
        data: {
          taskId,
          type: ActivityType.DESCRIPTION_CHANGE,
          oldValue: oldDescription,
          newValue: description,
          createdById: userId,
        },
      });
    }

    // STATUS CHANGE
    if (status && status !== oldStatus) {
      await tx.activityLog.create({
        data: {
          taskId,
          type: ActivityType.STATUS_CHANGE,
          oldValue: oldStatus,
          newValue: status,
          createdById: userId,
        },
      });
    }

    // PRIORITY CHANGE
if (priority && priority !== oldPriority) {
  await tx.activityLog.create({
    data: {
      taskId,
      type: ActivityType.PRIORITY_CHANGE,
      oldValue: oldPriority,
      newValue: priority,
      createdById: userId,
    },
  });
}

    // DUE DATE CHANGE
    if (dueDate) {
      const newDueDate = new Date(dueDate);
      if (
        !oldDueDate ||
        newDueDate.getTime() !== oldDueDate.getTime()
      ) {
        await tx.activityLog.create({
          data: {
            taskId,
            type: ActivityType.DUE_DATE_CHANGE,
            oldValue: oldDueDate
              ? oldDueDate.toISOString()
              : null,
            newValue: newDueDate.toISOString(),
            createdById: userId,
          },
        });
      }
    }

// ASSIGNMENT ADDED LOGS
if (addAssigneeIds?.length) {
  for (const assignedUserId of addAssigneeIds) {
    await tx.activityLog.create({
      data: {
        taskId,
        type: ActivityType.ASSIGNMENT_CHANGE,
        oldValue: null,
        newValue: `ASSIGNED:${assigneeMap[assignedUserId] || assignedUserId}`,
        createdById: userId,
      },
    });
  }
}


// ASSIGNMENT REMOVED LOGS
if (removeAssigneeIds?.length) {
  for (const removedUserId of removeAssigneeIds) {
    await tx.activityLog.create({
      data: {
        taskId,
        type: ActivityType.ASSIGNMENT_CHANGE,
        oldValue: `ASSIGNED:${assigneeMap[removedUserId] || removedUserId}`,
        newValue: `UNASSIGNED:${assigneeMap[removedUserId] || removedUserId}`,
        createdById: userId,
      },
    });
  }
}


    return updatedTask;
  });
};



//it shows users of project which is either assigned to task or not?(assigned user and not assigned user)
exports.getTaskForEdit = async ({
  taskId,
  userId,
  page = 1,
  limit = 10,
  search = "",
 }) => {
  if (!Number.isInteger(taskId)) {
    throw { status: 400, message: "Invalid taskId" };
  }

  const task = await prisma.task.findUnique({
    where: { id: taskId },
    include: {
      assignees: { select: { userId: true } },
    },
  });
 // console.log(task);
  // id: 28,
  // title: 'create task during final api check',
  // description: 'create task during final api check',
  // status: 'TODO',
  // priority: 'MEDIUM',
  // dueDate: 2026-01-14T00:00:00.000Z,
  // projectId: 16,
  // createdById: 5,
  // isDeleted: false,
  // deletedAt: null,
  // createdAt: 2026-01-13T09:09:45.870Z,
  // updatedAt: 2026-01-13T09:09:45.870Z,
  // assignees: [ { userId: 5 } ]

  if (!task || task.isDeleted) {
    throw { status: 404, message: "Task not found" };
  }
 //checking that particulat has access to edit(means it is part of project or not)
  await ensureProjectAccess(task.projectId, userId);

  const assignedIds = new Set(task.assignees.map(a => a.userId));
  const skip = (page - 1) * limit;

  const whereCondition = {
    projectId: task.projectId,
    ...(search && {
      user: {
        OR: [
          { name: { contains: search, mode: "insensitive" } },
          { email: { contains: search, mode: "insensitive" } },
        ],
      },
    }),
  };
  //console.log(whereCondition);

  const [members, total] = await prisma.$transaction([
    prisma.projectMember.findMany({
      where: whereCondition,
      skip,
      take: limit,
      orderBy: { joinedAt: "desc" },
      select: {
        user: {
          select: { id: true, name: true, email: true },
        },
      },
    }),
    prisma.projectMember.count({ where: whereCondition }),
  ]);

  return {
    task: {
      id: task.id,
      title: task.title,
      description: task.description,
      status: task.status,
      priority: task.priority,
      dueDate: task.dueDate,
    },
    members: members.map(m => ({
      ...m.user,
      assigned: assignedIds.has(m.user.id),
    })),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};





////////////////////////////////////////////////////////////////////////* SOFT DELETE TASK */
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
