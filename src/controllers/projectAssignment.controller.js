const service = require("../services/projectAssignment.service");

/* ADD MEMBERS (BULK) */
exports.addMembers = async (req, res) => {
  try {
    const projectId = Number(req.params.projectId);
    const { members } = req.body;

    const addedMembers = await service.addMembers({
      projectId,
      members,
    });

    res.status(201).json(addedMembers);
  } catch (error) {
    res.status(error.status || 500).json({
      message: error.message || "Failed to add members",
    });
  }
};
/* GET MEMBERS */
exports.getMembers = async (req, res) => {
  try {
    const projectId = Number(req.params.projectId);
    const members = await service.getMembers(projectId);
    res.status(200).json(members);
  } catch (error) {
    res.status(error.status || 500).json({
      message: error.message || "Failed to fetch members",
    });
  }
};

/* UPDATE ROLE */
exports.updateRole = async (req, res) => {
  try {
    const projectId = Number(req.params.projectId);
    const userId = Number(req.params.userId);
    const { role } = req.body;

    const member = await service.updateRole({
      projectId,
      userId,
      role,
    });

    res.status(200).json(member);
  } catch (error) {
    res.status(error.status || 500).json({
      message: error.message || "Failed to update role",
    });
  }
};
exports.getAvailableUsers = async (req, res) => {
  try {
    const projectId = Number(req.params.projectId);

    const data = await service.getAvailableUsersForProject(projectId);

    res.status(200).json(data);
  } catch (error) {
    res.status(error.status || 500).json({
      message: error.message || "Failed to fetch users",
    });
  }
};


/* REMOVE MEMBER */
exports.removeMember = async (req, res) => {
  try {
    const projectId = Number(req.params.projectId);
    const userId = Number(req.params.userId);

    await service.removeMember({ projectId, userId });

    res.status(200).json({ message: "Member removed" });
  } catch (error) {
    res.status(error.status || 500).json({
      message: error.message || "Failed to remove member",
    });
  }
};
