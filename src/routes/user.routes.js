const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth.middleware");
const controller = require("../controllers/user.controller");


//on user main page show how many projects in user invovled
//USER PAGE API
router.get("/projects", auth, controller.getUserProjects);

module.exports = router;
