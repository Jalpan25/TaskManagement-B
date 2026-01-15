const prisma = require("../prisma");
const { ActivityType } = require("@prisma/client");
const { ensureProjectAccess } = require("../utils/projectAccess.util");

/* CREATE COMMENT */
exports.createComment = async ({ taskId, userId, content }) => {
  if (!taskId || isNaN(taskId)) {
    throw new Error("Invalid taskId");
  }

  if (!content || !content.trim()) {
    throw new Error("Comment content is required");
  }

  if (content.length > 1000) {
    throw new Error("Comment too long");
  }

  const parsedTaskId = Number(taskId);

  const task = await prisma.task.findUnique({
    where: { id: parsedTaskId },
    select: {
      id: true,
      isDeleted: true,
      projectId: true,
    },
  });

  if (!task || task.isDeleted) {
    const err = new Error("Task not found");
    err.status = 404;
    throw err;
  }

  ensureProjectAccess(task.projectId, userId);

  return await prisma.$transaction(async (tx) => {
    await tx.comment.create({
      data: {
        content: content.trim(),
        taskId: parsedTaskId,
        authorId: userId,
      },
    });

    await tx.activityLog.create({
      data: {
        taskId: parsedTaskId,
        type: ActivityType.COMMENT_ADDED,
        oldValue: null,
        newValue: content.trim().slice(0, 300),
        createdById: userId,
      },
    });

    return { message: "Comment created successfully" };
  });
};


/* GET COMMENTS BY TASKID */
exports.getCommentsByTask = async (taskId,userId) => {
   const parsedTaskId = Number(taskId);
  if (isNaN(taskId)) {
    throw { status: 400, message: "Invalid taskId" };
  }
    //NEED projectId
  const task_projectId=await prisma.task.findFirst({
    where:{id:taskId},
    select:{
      projectId:true
    }
  })
  ensureProjectAccess(task_projectId.projectId,userId);

  // const comments= prisma.comment.findMany({
  //   where: { taskId },
  //   include: {
  //     author: {
  //       select: { 
  //         id:true,
  //         name: true },
  //     },
  //   },
  //          select:{
  //       id:true,
  //     },

  //   orderBy: { createdAt: "asc" },
  // });

    const comments = await prisma.comment.findMany({
    where: { taskId: parsedTaskId,isDeleted:false },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      content: true,
      createdAt: true,
      author: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  const formattedComment=(await comments).map((c)=>({
    id:c.id,
  content: c.content,
  createdAt: c.createdAt,
  authorName: c.author.name,
  authorId:c.author.id,
  }))
  return formattedComment;
};

/* UPDATE COMMENT */
exports.updateComment = async ({ commentId, userId, content }) => {
 
  const parsedCommentId = Number(commentId);

  if (!parsedCommentId || isNaN(parsedCommentId)) {
    throw { status: 400, message: "Invalid commentId" };
  }

  if (!content || !content.trim()) {
    throw { status: 400, message: "Comment content is required" };
  }

  if (content.length > 1000) {
    throw { status: 400, message: "Comment too long" };
  }

  const comment = await prisma.comment.findUnique({
    where: { id: parsedCommentId },
    include: {
      task: {
        select: {
          id: true,
          isDeleted: true,
          projectId: true,
        },
      },
    },
  });

  //comment is deleted or not
  if (!comment || comment.task.isDeleted) {
    throw { status: 404, message: "Comment not found" };
  }

 
  // Author check
  if (comment.authorId !== userId) {
    throw { status: 403, message: "You can update only your own comment" };
  }


//comment is not updated
  if (comment.content === content.trim()) {
    throw { status: 400, message: "No changes detected" };
  }


 await prisma.$transaction(async (tx) => {
    const updated = await tx.comment.update({
      where: { id: parsedCommentId },
      data: { content: content.trim() },
    });

    await tx.activityLog.create({
      data: {
        taskId: comment.taskId,
        type: ActivityType.COMMENT_UPDATED,
        oldValue: comment.content.slice(0, 300),//store only 300 char only not more
        newValue: content.trim().slice(0, 300),
        createdById: userId,
      },
    });

    return updated;
  });

  return {
    response:"commnet updated successfully"
  }
};


/* DELETE COMMENT */
exports.deleteComment = async ({ commentId, userId }) => {
  const parsedCommentId = Number(commentId);

  if (isNaN(parsedCommentId)) {
    throw { status: 400, message: "Invalid commentId" };
  }

  const comment = await prisma.comment.findUnique({
    where: { id: parsedCommentId },
    include: {
      task: {
        select: {
          projectId: true,
          isDeleted: true,
        },
      },
    },
  });

  if (!comment || comment.task.isDeleted) {
    throw { status: 404, message: "Comment not found" };
  }

  // Author check
  if (comment.authorId !== userId) {
    throw { status: 403, message: "You can delete only your own comment" };
  }

  return prisma.$transaction(async (tx) => {
    await tx.comment.update({
      where: { id: parsedCommentId },
      data: { isDeleted: true },
    });

    await tx.activityLog.create({
      data: {
        taskId: comment.taskId, 
        type: ActivityType.COMMENT_DELETED,
        oldValue: comment.content.slice(0, 300),
        newValue: null,
        createdById: userId,
      },
    });

    return { message: "Comment deleted successfully" };
  });
};

