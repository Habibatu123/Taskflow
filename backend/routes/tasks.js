const express = require("express");
const Task = require("../models/Task");
const Project = require("../models/Project");
const auth = require("../middleware/auth");
const router = express.Router();

// Add task to project
router.post("/:projectId", auth, async (req, res) => {
  try {
    const { title, description, status, dueDate, priority, order } = req.body;
    if (!title || title.trim() === "") {
      return res.status(400).json({ error: "Task title is required" });
    }

    if (status && !["todo", "in-progress", "completed"].includes(status)) {
      return res.status(400).json({ error: "Invalid status value" });
    }

    if (priority && !["low", "medium", "high"].includes(priority)) {
      return res.status(400).json({ error: "Invalid priority value" });
    }

    if (dueDate && isNaN(new Date(dueDate).getTime())) {
      return res.status(400).json({ error: "Invalid due date format" });
    }

    const project = await Project.findById(req.params.projectId);
    if (!project) {
      return res.status(404).json({ error: "Project not found" });
    }

    let taskOrder = order;
    if (typeof order !== "number" || order < 0) {
      // If order is not provided or invalid, set it to the next available order
      const lastTask = await Task.find({ project: req.params.projectId })
        .sort({ order: -1 })
        .limit(1);
      taskOrder = lastTask.length > 0 ? lastTask[0].order + 1 : 0;
    }

    // Create new task
    const task = new Task({
      ...req.body,
      order: taskOrder,
      project: req.params.projectId,
    });
    await task.save();

    // Attach task to project
    await Project.findByIdAndUpdate(req.params.projectId, {
      $push: { tasks: task._id },
    });

    res.status(201).json(task);
  } catch (err) {
    console.error("Error creating task:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get tasks for a project
router.get("/:projectId", auth, async (req, res) => {
  try {
    const project = await Project.findById(req.params.projectId);
    if (!project) {
      return res.status(404).json({ error: "Project not found" });
    }

    const tasks = await Task.find({ project: req.params.projectId })
      .populate("assignedTo")
      .sort({ order: 1 });
    res.json(tasks);
  } catch (err) {
    console.error("Error fetching tasks:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
