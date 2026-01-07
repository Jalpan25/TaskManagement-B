require("dotenv").config();
const express = require("express");
const cors = require("cors");
const projectRoutes = require("./routes/project.routes");
const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Task Manager API is running");
});
app.use("/projects", projectRoutes);
app.use(
  "/projects",
  require("./routes/projectAssignment.routes")
);
app.use("/user", require("./routes/user.routes"));

app.use("/", require("./routes/task.routes"));




const PORT = process.env.PORT || 5000;
const authRoutes = require("./routes/auth.routes");
app.use("/auth", authRoutes);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 
