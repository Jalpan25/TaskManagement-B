const prisma = require("../prisma");

exports.getUserProjects = async (userId) => {
  return prisma.project.findMany({
    where: {
      isDeleted: false,
      members: {
        some: {
          userId,
        },
      },
    },
    select: {
      id: true,
      name: true,
      description: true,
      status: true,
      createdAt: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });
};


