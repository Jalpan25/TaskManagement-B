const express = require("express");
const router = express.Router();

const auth = require("../middleware/auth.middleware.js");
const commentPermission = require("../middleware/commentPermission.middleware.js");
const controller = require("../controllers/comment.controller.js");
const ensureProjectAccess=require("../utils/projectAccess.util.js")
// Create comment
router.post(
  "/tasks/:taskId/comments",
  auth,
  controller.createComment
);

// Get comments
router.get(
  "/tasks/:taskId/comments",
  auth,
  controller.getCommentsByTask
);

// Update comment
router.put(
  "/comments/:commentId",
  auth,
  controller.updateComment
);

// Delete comment
router.delete(
  "/comments/:commentId",
  auth,
  controller.deleteComment
);

module.exports = router;
