const express = require("express");
const Project = require("../models/Project");
const Task = require("../models/Task");
const auth = require("../middleware/auth");
const router = express.Router();

// Create project
router.post("/", auth, async (req, res) => {
  const { name, description, order } = req.body;
  // Validate request body
  if (!name || name.trim() === "") {
    return res.status(400).json({ error: "Project name is required" });
  }
  let projectOrder = order;
  if (typeof order !== "number" || order < 0) {
    // If order is not provided or invalid, set it to the next available order
    const lastProject = await Project.findOne({ owner: req.user.id }).sort({
      order: -1,
    });
    projectOrder = lastProject ? lastProject.order + 1 : 0;
  }
  // Create new project

  try {
    const project = new Project({
      ...req.body,
      order: projectOrder,
      owner: req.user.id,
    });
    await project.save();
    res.status(201).json(project);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update project
router.put("/:id", auth, async (req, res) => {
  const { name, description, status, order } = req.body;
  // Validate request body
  if (!name || name.trim() === "") {
    return res.status(400).json({ error: "Project name is required" });
  }
  try {
    const project = await Project.findByIdAndUpdate(
      req.params.id,
      { name, description, status, order },
      { new: true }
    );
    if (!project) {
      return res.status(404).json({ error: "Project not found" });
    }
    res.json(project);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete project
router.delete("/:id", auth, async (req, res) => {
  try {
    const project = await Project.findByIdAndDelete(req.params.id);
    if (!project) {
      return res.status(404).json({ error: "Project not found" });
    }
    // Optionally delete all tasks associated with the project
    await Task.deleteMany({ project: req.params.id });
    res.json({ message: "Project deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
// Get project by ID
router.get("/:id", auth, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id).populate("tasks");
    if (!project) {
      return res.status(404).json({ error: "Project not found" });
    }
    // Check if the user is the owner of the project
    if (project.owner.toString() !== req.user.id) {
      return res.status(403).json({ error: "Access denied" });
    }
    res.json(project);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all projects for user
router.get("/", auth, async (req, res) => {
  const projects = await Project.find({ owner: req.user.id }).populate("tasks");
  res.json(projects);
});

module.exports = router;
