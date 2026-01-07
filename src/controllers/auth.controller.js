const authService = require("../services/auth.service.js");

exports.register = async (req, res) => {
  try {
    const user = await authService.register(req.body);
    res.status(201).json(user);
  } catch (error) {
    console.error("Register Error:", error);
    res.status(error.status || 500).json({
      message: error.message || "Something went wrong",
    });
  }
};

exports.login = async (req, res) => {
  try {
    const data = await authService.login(req.body);
    res.json(data);
  } catch (error) {
    console.error("Login Error:", error);
    res.status(error.status || 500).json({
      message: error.message || "Invalid credentials",
    });
  }
};
