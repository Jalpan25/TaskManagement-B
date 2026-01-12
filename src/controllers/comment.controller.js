const commentService = require("../services/comment.service");

/* CREATE COMMENT */
exports.createComment = async (req, res) => {
  try {
    const taskId = Number(req.params.taskId);
    const userId = req.user.id;
    const { content } = req.body;

    if (!content?.trim()) {
      return res.status(400).json({ message: "Comment content is required" });
    }

    const comment = await commentService.createComment({
      taskId,
      userId,
      content: content.trim(),
    });

    res.status(201).json(comment);
  } catch (error) {
    res.status(error.status || 500).json({
      message: error.message || "Failed to add comment",
    });
  }
};

/* GET COMMENTS BY TASK */
exports.getCommentsByTask = async (req, res) => {

  try {
    const taskId = Number(req.params.taskId);

    const comments = await commentService.getCommentsByTask(taskId,Number(req.user.id));
    res.status(200).json(comments);
  } catch (error) {
    res.status(error.status || 500).json({
      message: error.message || "Failed to fetch comments",
    });
  }
};

/* UPDATE COMMENT */
exports.updateComment = async (req, res) => {
  try {
    const commentId = Number(req.params.commentId);
    const userId = req.user.id;
    const { content } = req.body;

    if (!content?.trim()) {
      return res.status(400).json({ message: "Comment content is required" });
    }

    const updated = await commentService.updateComment({
      commentId,
      userId,
      content: content.trim(),
    });

    res.status(200).json(updated);
  } catch (error) {
    res.status(error.status || 500).json({
      message: error.message || "Failed to update comment",
    });
  }
};

/* DELETE COMMENT */
exports.deleteComment = async (req, res) => {
  try {
    const commentId = Number(req.params.commentId);
    const userId = req.user.id;

    await commentService.deleteComment({ commentId, userId });

    res.status(200).json({ message: "Comment deleted" });
  } catch (error) {
    res.status(error.status || 500).json({
      message: error.message || "Failed to delete comment",
    });
  }
};

