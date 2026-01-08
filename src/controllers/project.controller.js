const projectService = require("../services/project.service");

/* CREATE */
exports.createProject = async (req, res) => {
  try {
    const project = await projectService.createProject({
      name: req.body.name,
      description: req.body.description,
      userId: req.user.id,
    });

    res.status(201).json(project);
  } catch (error) {
    res.status(error.status || 500).json({
      message: error.message || "Failed to create project",
    });
  }
};

exports.getProjectMembers = async (req, res) => {
  try {
    const projectId = Number(req.params.projectId);
    const userId = req.user.id;

    const members = await projectService.getProjectMembers({
      projectId,
      userId,
    });

    res.json(members);
  } catch (err) {
    res.status(err.status || 500).json({
      message: err.message || "Failed to fetch project members",
    });
  }
};




/* UPDATE */
exports.updateProject = async (req, res) => {
  try {
    const projectId = Number(req.params.projectId);

    if (isNaN(projectId)) {
      return res.status(400).json({ message: "Invalid project ID" });
    }

    const project = await projectService.updateProject({
      projectId,
      name: req.body.name,
      description: req.body.description,
    });

    res.status(200).json(project);
  } catch (error) {
    res.status(error.status || 500).json({
      message: error.message || "Failed to update project",
    });
  }
};

/* GET BY ID */
exports.getProject = async (req, res) => {
  try {
    const projectId = Number(req.params.projectId);

    if (isNaN(projectId)) {
      return res.status(400).json({ message: "Invalid project ID" });
    }

    const project = await projectService.getProjectById(projectId);
    res.status(200).json(project);
  } catch (error) {
    res.status(error.status || 500).json({
      message: error.message || "Failed to fetch project",
    });
  }
};

/* GET ALL */
exports.getProjects = async (req, res) => {
  try {
    const projects = await projectService.getProjects(req.user);
    res.status(200).json(projects);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch projects" });
  }
};

/* DELETE */
exports.deleteProject = async (req, res) => {
  try {
    const projectId = Number(req.params.projectId);

    if (isNaN(projectId)) {
      return res.status(400).json({ message: "Invalid project ID" });
    }

    await projectService.deleteProject(projectId);

    res.status(200).json({
      message: "Project deleted successfully",
    });
  } catch (error) {
    res.status(error.status || 500).json({
      message: error.message || "Failed to delete project",
    });
  }
};
