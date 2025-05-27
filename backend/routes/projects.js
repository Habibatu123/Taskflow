const express = require('express');
const Project = require('../models/Project');
const Task = require('../models/Task');
const auth = require('../middleware/auth');
const router = express.Router();

// Create project
router.post('/', auth, async (req, res) => {
  try {
    const project = new Project({ ...req.body, owner: req.user.id });
    await project.save();
    res.status(201).json(project);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all projects for user
router.get('/', auth, async (req, res) => {
  const projects = await Project.find({ owner: req.user.id }).populate('tasks');
  res.json(projects);
});

module.exports = router;
