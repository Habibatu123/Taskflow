const express = require('express');
const Task = require('../models/Task');
const Project = require('../models/Project');
const auth = require('../middleware/auth');
const router = express.Router();

// Add task to project
router.post('/:projectId', auth, async (req, res) => {
  try {
    const { projectId } = req.params;
    const task = new Task({ ...req.body, project: projectId });
    await task.save();

    // Attach task to project
    await Project.findByIdAndUpdate(projectId, { $push: { tasks: task._id } });

    res.status(201).json(task);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get tasks for a project
router.get('/:projectId', auth, async (req, res) => {
  const tasks = await Task.find({ project: req.params.projectId }).populate('assignedTo');
  res.json(tasks);
});

module.exports = router;
