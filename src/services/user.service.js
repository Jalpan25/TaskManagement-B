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

// SELECT DISTINCT
//     p.id,
//     p.name,
//     p.description,
//     p.status,
//     p.created_at
// FROM project p
// JOIN project_member pm
//     ON pm.project_id = p.id
// WHERE
//     p.is_deleted = FALSE
//     AND pm.user_id = :userId
// ORDER BY
//     p.created_at DESC;


