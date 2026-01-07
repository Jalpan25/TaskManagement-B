const userService = require("../services/user.service");

exports.getUserProjects = async (req, res) => {
  try {
    const projects = await userService.getUserProjects(req.user.id);
    res.status(200).json(projects);
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch user projects",
    });
  }
};
