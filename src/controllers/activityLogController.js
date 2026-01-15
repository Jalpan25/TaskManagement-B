// controllers/activityLogController.js
const activityLogService = require("../services/activityLogService");

exports.getTaskActivityLogs = async (req, res) => {
  const { taskId } = req.params;
  const { limit, cursor } = req.query;
  const userId = req.user.id;

  const data = await activityLogService.getTaskActivityLogs({
    taskId: Number(taskId),
    userId,
    limit: limit ? Number(limit) : 20,
    cursor: cursor ? Number(cursor) : undefined,
  });

  res.json(data);
};
