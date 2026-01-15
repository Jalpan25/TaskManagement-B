require("dotenv").config();
const express = require("express");
const cors = require("cors");
const projectRoutes = require("./routes/project.routes");
const authRoutes = require("./routes/auth.routes");
const projectAssignmentRoutes = require("./routes/projectAssignment.routes");
const userRoutes = require("./routes/user.routes")
const taskRoutes = require("./routes/task.routes")
const commentRoutes = require("./routes/comment.routes");
projectActivityLogRoutes=require("./routes/projectActivityLog.routes")
const app = express();

app.use(cors());
app.use(express.json());



const PORT = process.env.PORT || 5000;

// app.get("/", (req, res) => {
//   res.send("Task Manager API is running");
// });

app.use("/auth", authRoutes);
app.use("/projects", projectRoutes);
app.use(
  "/projects",
  projectAssignmentRoutes
);

app.use("/tasks", projectActivityLogRoutes);


//USER PAGE FIRST PAGE API
app.use("/user", userRoutes);
//TASK ROUTES ARE HERE
app.use("/", taskRoutes);

//Comment CRUD
app.use("/", commentRoutes);


app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 
