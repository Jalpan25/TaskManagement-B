const prisma = require("../prisma");
const { ensureProjectAccess } = require("../utils/projectAccess.util");

const {VALID_STATUSES,VALID_PRIORITIES} =require("../constants/constant")

///////////////////////////////////////////////////////////////////* CREATE TASK */
exports.createTask = async ({ projectId, userId, data }) => {

  if (!Number.isInteger(projectId)) {
 throw { status: 404, message: "Invalid Project Id" };
}
  await ensureProjectAccess(projectId, userId);

  const { title, description, priority, status, dueDate, assigneeIds } = data;
  console.log(data);

  //  Title validation
  if (!title || title.trim() === "") {
    throw { status: 400, message: "Task title is required" };
  }

  //title length is not too long
  if (title.length > 200) {
  throw { status: 400, message: "Title too long" };
}
//desc too long not allowed


console.log(description);
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

  // 🔹 Base condition (always applied)
  const where = {
    projectId,
    isDeleted: false,
  };

  // 🔍 Search (title)
if (search) {
  where.title = {
    contains: search,    //it is like these===>WHERE title ILIKE '%search%'
    mode: "insensitive",   //case allowed upper and lower
  };
}

  // 🏷 Status filter
  if (status) {
    where.status = status;
  }

  // 🚦 Priority filter
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
  const task = await prisma.task.findUnique({ where: { id: taskId } });

  if (!task || task.isDeleted) {
    throw { status: 404, message: "Task not found" };
  }

  await ensureProjectAccess(task.projectId, userId);

  const {
    title,
    status,
    priority,
    dueDate,
    addAssigneeIds,
    removeAssigneeIds,
  } = data;

  // ✅ Status validation
  if (status && !VALID_STATUSES.includes(status)) {
    throw { status: 400, message: "Invalid task status" };
  }

  // ✅ Due date validation (FIX)
  if (dueDate) {
    const parsedDate = new Date(dueDate);

    if (isNaN(parsedDate.getTime())) {
      throw { status: 400, message: "Invalid due date" };
    }

    if (parsedDate < new Date()) {
      throw { status: 400, message: "Due date must be in the future" };
    }
  }


  //limited assigned allowed 
  const MAX_ASSIGNEES = 20;
if (addAssigneeIds?.length > MAX_ASSIGNEES) {
  throw { status: 400, message: "Too many assignees" };
}

//only upvert is allowed 
const STATUS_ORDER = {
  TODO: 1,
  IN_PROGRESS: 2,
  UNDER_REVIEW: 3,
  DONE: 4,
};
if (status) {
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


  return prisma.$transaction(async (tx) => {
    const updatedTask = await tx.task.update({
      where: { id: taskId },
      data: {
        ...(title && { title: title.trim() }),
        ...(status && { status }),
        ...(priority && { priority }),
        ...(dueDate && { dueDate: new Date(dueDate) }),
      },
    });

    //  Add assignees
    if (addAssigneeIds?.length) {
      await tx.taskAssignee.createMany({
        data: addAssigneeIds.map((uid) => ({
          taskId,
          userId: uid,
        })),
        skipDuplicates: true,
      });
    }

    //  Remove assignees
    if (removeAssigneeIds?.length) {
      await tx.taskAssignee.deleteMany({
        where: {
          taskId,
          userId: { in: removeAssigneeIds },
        },
      });
    }

    return updatedTask;
  });
};



///get task for update(inside edit task gives task deatils)
exports.getTaskForEdit = async ({ taskId, userId }) => {

  if (!Number.isInteger(taskId)) {
  throw { status: 400, message: "Invalid taskId" };
}

  const task = await prisma.task.findUnique({
    where: { id: taskId },
    include: {
      assignees: {
        select: { userId: true },
      },
    },
  });

  if (!task || task.isDeleted) {
    throw { status: 404, message: "Task not found" };
  }

  await ensureProjectAccess(task.projectId, userId);

  const assignedIds = new Set(task.assignees.map(a => a.userId));

  const members = await prisma.projectMember.findMany({
    where: { projectId: task.projectId },
    select: {
      user: {
        select: { id: true, name: true, email: true },
      },
    },
  });

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
