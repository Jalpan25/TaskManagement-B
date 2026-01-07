const prisma = require("../prisma");

exports.ensureProjectAccess = async (projectId, userId) => {
  const member = await prisma.projectMember.findFirst({
    where: {
      projectId,
      userId,
      project: { isDeleted: false },
    },
  });

  if (!member) {
    throw { status: 403, message: "Access denied" };
  }
};
