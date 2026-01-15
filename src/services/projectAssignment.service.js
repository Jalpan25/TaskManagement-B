const prisma = require("../prisma");

/* ADD MEMBERS (BULK) */
exports.addMembers = async ({ projectId, members }) => {
  if (isNaN(projectId) || !Array.isArray(members) || members.length === 0) {
    throw { status: 400, message: "Invalid input" };
  }

  // Check project (not deleted)
  const project = await prisma.project.findFirst({
    where: {
      id: projectId,
      isDeleted: false,
    },
  });

  if (!project) {
    throw { status: 404, message: "Project not found" };
  }

  // Collect unique userIds
  const userIds = [...new Set(members.map((m) => Number(m.userId)))];

  // Fetch active users
  const users = await prisma.user.findMany({
    where: {
      id: { in: userIds },                 //get users of these userIDS
      isActive: true,
    },
  });
  //console.log(users);
  

  const validUserIds = users.map((u) => u.id);
   

  if (validUserIds.length === 0) {
    throw { status: 400, message: "No valid users found" };
  }

  // Existing members
  const existingMembers = await prisma.projectMember.findMany({
    where: {
      projectId,
      userId: { in: validUserIds },
    },
    select: { userId: true },
  });

  const existingUserIds = existingMembers.map((m) => m.userId);

  // Filter only new members
  const newMembers = members
    .filter(
      (m) =>
        validUserIds.includes(Number(m.userId)) &&
        !existingUserIds.includes(Number(m.userId))
    )
    .map((m) => ({
      projectId,
      userId: Number(m.userId),
      role: m.role || "MEMBER",
    }));

  if (newMembers.length === 0) {
    throw {
      status: 400,
      message: "All users are already members of this project",
    };
  }

  // Insert members
  await prisma.projectMember.createMany({
    data: newMembers,
  });

  // Return clean response
  return prisma.projectMember.findMany({
    where: {
      projectId,
      userId: { in: newMembers.map((m) => m.userId) },
    },
    select: {
      role: true,
      joinedAt: true,
      user: {
        select: {
          name: true,
          email: true,
        },
      },
    },
  });
};

/* GET MEMBERS */
exports.getMembers = async (projectId) => {
  if (isNaN(projectId)) {
    throw { status: 400, message: "Invalid project ID" };
  }

  return prisma.projectMember.findMany({
    where: {
      projectId,
      project: { isDeleted: false },
    },
    select: {
      role: true,
      joinedAt: true,
      user: {
        select: {
          id:true,
          name: true,
          email: true,
        },
      },
    },
  });
};

/* REMOVE MEMBER */
exports.removeMember = async ({ projectId, userId }) => {
  projectId = Number(projectId);
  userId = Number(userId);

  if (isNaN(projectId) || isNaN(userId)) {
    throw { status: 400, message: "Invalid input" };
  }

  const existing = await prisma.projectMember.findUnique({
    where: {
      projectId_userId: { projectId, userId },
    },
  });

  if (!existing) {
    throw {
      status: 404,
      message: "Member not found or already removed",
    };
  }

  //  TRANSACTION (important)
  await prisma.$transaction(async (tx) => {
    // 1 Remove user from all tasks of this project
    await tx.taskAssignee.deleteMany({
      where: {
        userId,
        task: {
          projectId,
          isDeleted: false,
        },
      },
    });

    // Remove user from project
    await tx.projectMember.delete({
      where: {
        projectId_userId: { projectId, userId },
      },
    });
  });
};


exports.getAvailableUsersForProject = async (projectId) => {
  projectId = Number(projectId);
  if (isNaN(projectId)) {
    throw { status: 400, message: "Invalid project ID" };
  }

  const project = await prisma.project.findFirst({
    where: { id: projectId, isDeleted: false },
  });

  if (!project) {
    throw { status: 404, message: "Project not found" };
  }

  // Assigned members + task count(counting user assigned in how any task)
  const assignedMembers = await prisma.projectMember.findMany({
    where: { projectId },
    select: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          taskAssignments: {
            where: {
              task: {
                projectId,
                isDeleted: false,
              },
            },
            select: { id: true },
          },
        },
      },
    },
  });

  console.log(assignedMembers);

  const assigned = assignedMembers.map((m) => ({
    id: m.user.id,
    name: m.user.name,
    email: m.user.email,
    hasAssignedTasks: m.user.taskAssignments.length > 0,
  }));

  const assignedUserIds = assigned.map((u) => u.id);

  //  Available users (active but not assigned)
  const available = await prisma.user.findMany({
    where: {
      isActive: true,
      id: { notIn: assignedUserIds },
    },
    select: {
      id: true,
      name: true,
      email: true,
    },
  });

  return { assigned, available };
};


