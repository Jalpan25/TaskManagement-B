const prisma = require("../prisma");
const { mapProject } = require("./project.mapper");

const {ensureProjectAccess} =require("../utils/projectAccess.util")


//gives all member for that projects
exports.getProjectMembers = async ({
  projectId,
  userId,
  page,
  limit,
  search,
}) => {
  await ensureProjectAccess(projectId, userId);

  if (page < 1 || limit < 1) {
    throw { status: 400, message: "Invalid pagination values" };
  }

  const MAX_LIMIT = 50;
  if (limit > MAX_LIMIT) {
    throw { status: 400, message: "Limit exceeds maximum allowed" };
  }

  const skip = (page - 1) * limit;

  const whereCondition = {
    projectId,
    ...(search && {
      user: {
        name: {
          contains: search,
          mode: "insensitive",
        },
      },
    }),
  };

  const [members, total] = await prisma.$transaction([
    prisma.projectMember.findMany({
      where: whereCondition,
      skip,
      take: limit,
      orderBy: {
        joinedAt: "desc",
      },
      select: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    }),

    prisma.projectMember.count({
      where: whereCondition,
    }),
  ]);

  return {
    data: members.map((m) => m.user),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};



/* CREATE PROJECT */
exports.createProject = async ({ name, description, userId }) => {
  if (!name || name.trim() === "") {
    throw { status: 400, message: "Project name is required" };
  }

  if (!description || description.trim() === "") {
    throw { status: 400, message: "Project description is required" };
  }

  const project = await prisma.project.create({
    data: {
      name: name.trim(),
      description: description.trim(),
      createdById: userId,
      members: {
        create: {
          userId,
          role: "OWNER",
        },
      },
    },
  });

  return mapProject(project);
};


/* UPDATE PROJECT */
exports.updateProject = async ({ projectId, name, description }) => {
  //  Reject empty strings
  if (
    (name !== undefined && name.trim() === "") ||
    (description !== undefined && description.trim() === "")
  ) {
    throw {
      status: 400,
      message: "Name and description cannot be empty",
    };
  }

  // Nothing to update
  if (name === undefined && description === undefined) {
    throw {
      status: 400,
      message: "At least one field is required",
    };
  }

  const project = await prisma.project.findFirst({
    where: { id: projectId, isDeleted: false },
  });

  if (!project) {
    throw { status: 404, message: "Project not found" };
  }

  const updated = await prisma.project.update({
    where: { id: projectId },
    data: {
      ...(name !== undefined && { name }),
      ...(description !== undefined && { description }),
    },
  });

  return mapProject(updated);
};


/* GET PROJECT BY ID */
exports.getProjectById = async (projectId) => {
  const project = await prisma.project.findFirst({
    where: { id: projectId, isDeleted: false },
    include: {
      tasks: {
        where: { isDeleted: false },
        select: {
          id: true,
          title: true,
          status: true,
          priority: true,
          dueDate: true,
        },
      },
    },
  });

  if (!project) {
    throw { status: 404, message: "Project not found" };
  }

  return {
    ...mapProject(project),
    tasks: project.tasks,
  };
};


/* GET ALL PROJECTS */
exports.getProjects = async (user) => {
  const where = { isDeleted: false };

  if (user.role !== "ADMIN") {
    //GET ONLY THAT PROJECT INSIDE THESE PERSON INVLOVED
    where.members = { some: { userId: user.id } };
  }

  // userID - 6

  // 1 - [3,4,5]
  // 2 - [6,7,9]
  // 3 - [6,4,1]

  // return project : [2 , 3]

  const projects = await prisma.project.findMany({
    where,
    orderBy: { createdAt: "desc" },
  });

  return projects.map(mapProject);
};


// DELETE PROJECT soft delete
exports.deleteProject = async (projectId) => {
  const project = await prisma.project.findFirst({
    where: { id: projectId, isDeleted: false },
  });

  if (!project) {
    throw { status: 404, message: "Project not found" };
  }

  await prisma.$transaction([
    // Soft delete project
    prisma.project.update({
      where: { id: projectId },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
      },
    }),

    // Soft delete all tasks in project
    prisma.task.updateMany({
      where: { projectId, isDeleted: false },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
      },
    }),
  ]);
};


