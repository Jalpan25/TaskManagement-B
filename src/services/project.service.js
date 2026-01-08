const prisma = require("../prisma");
const { mapProject } = require("./project.mapper");

const {ensureProjectAccess} =require("../utils/projectAccess.util")
//gives all member for that projects
exports.getProjectMembers = async ({ projectId, userId }) => {
  //  Ensure requester has access
  await ensureProjectAccess(projectId, userId);

  const members = await prisma.projectMember.findMany({
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

  return members.map((m) => m.user);
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


