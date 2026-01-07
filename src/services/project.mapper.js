//for return clean object
//give that data which user require
exports.mapProject = (project) => ({
  id: project.id,
  name: project.name,
  description: project.description,
  status: project.status,
  createdAt: project.createdAt,
});
