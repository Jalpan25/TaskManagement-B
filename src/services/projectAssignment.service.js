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
  if (isNaN(projectId) || isNaN(userId)) {
    throw { status: 400, message: "Invalid input" };
  }

  const existing = await prisma.projectMember.findUnique({
    where: { projectId_userId: { projectId, userId } },
  });

  if (!existing) {
    throw {
      status: 404,
      message: "Member not found or already removed",
    };
  }

  await prisma.projectMember.delete({
    where: { projectId_userId: { projectId, userId } },
  });
};

exports.getAvailableUsersForProject = async (projectId) => {
  if (isNaN(projectId)) {
    throw { status: 400, message: "Invalid project ID" };
  }

  // Check project
  const project = await prisma.project.findFirst({
    where: {
      id: projectId,
      isDeleted: false,
    },
  });

  if (!project) {
    throw { status: 404, message: "Project not found" };
  }

  // Users already assigned to project
  const assignedMembers = await prisma.projectMember.findMany({
    where: { projectId },
    select: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });

  const assignedUserIds = assignedMembers.map(
    (m) => m.user.id
  );

  // All active users
  const allActiveUsers = await prisma.user.findMany({
    where: {
      isActive: true,
    },
    select: {
      id: true,
      name: true,
      email: true,
    },
  });

  const assigned = [];
  const available = [];

  allActiveUsers.forEach((user) => {
    if (assignedUserIds.includes(user.id)) {
      assigned.push(user);
    } else {
      available.push(user);
    }
  });

  return { assigned, available };
};


