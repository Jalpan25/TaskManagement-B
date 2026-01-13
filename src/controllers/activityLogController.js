const activityLogService=require("../services/activityLogService")

exports.getProjectActivityLogs = async (req, res) => {
  const { projectId } = req.params;
  const { limit, cursor } = req.query;
 const userId=req.user.id ;
  const data = await activityLogService.getProjectActivityLogs({
    projectId,
    userId,
    limit: limit ? Number(limit) : 20,
    cursor: cursor ? Number(cursor) : undefined,
  });

  res.json(data);
};
