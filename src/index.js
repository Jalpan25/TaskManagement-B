require("dotenv").config();
const express = require("express");
const cors = require("cors");
const projectRoutes = require("./routes/project.routes");
const authRoutes = require("./routes/auth.routes");
const projectAssignmentRoutes = require("./routes/projectAssignment.routes");
const userRoutes = require("./routes/user.routes")
const taskRoutes = require("./routes/task.routes")
const commentRoutes = require("./routes/comment.routes");
const selfDeatilsRoutes=require("./routes/selfDetails.routes");
projectActivityLogRoutes=require("./routes/projectActivityLog.routes")
const {apiLimiter}=require("./middleware/rateLimiter.middleware")
const app = express();

app.use(cors());
app.use(express.json());



const PORT = process.env.PORT || 5000;

// app.get("/", (req, res) => {
//   res.send("Task Manager API is running");
// });

app.use("/auth", apiLimiter,authRoutes);
app.use("/projects",apiLimiter, projectRoutes);
app.use(
  "/projects",apiLimiter,
  projectAssignmentRoutes
);

app.use("/tasks",apiLimiter, projectActivityLogRoutes);


//USER PAGE FIRST PAGE API
app.use("/user",apiLimiter, userRoutes);
//TASK ROUTES ARE HERE
app.use("/",apiLimiter, taskRoutes);

//Comment CRUD
app.use("/",apiLimiter, commentRoutes);

app.use("/",apiLimiter,selfDeatilsRoutes);


app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 
