const express = require("express");
const cors = require("cors");
const path = require("path");
const authRoutes = require("./src/routes/authRoutes");
const surveyRoutes = require("./src/routes/surveyRoutes");
const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "../FE")));
app.use("/api/auth", authRoutes);
app.use("/api/surveys", surveyRoutes);
// Unknown API endpoints must return JSON, not the frontend HTML.
app.use("/api", (req, res) => res.status(404).json({ error: "API endpoint not found" }));
app.get(/.*/, (req, res) => res.sendFile(path.join(__dirname, "../FE/index.html")));
if (require.main === module) {
  const port = Number(process.env.PORT || 8080);
  app.listen(port, (error) => {
    if (error) {
      console.error("Cannot start ITS server:", error.message);
      process.exitCode = 1;
      return;
    }
    console.log(`ITS is running at http://localhost:${port}`);
  });
}
module.exports = app;
