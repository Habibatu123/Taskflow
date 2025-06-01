const express = require("express");
const Project = require("../models/Project");
const Task = require("../models/Task");
const { verifyToken } = require("../middleware/auth");
const router = express.Router();

/**
 * @swagger
 * /api/projects:
 *   post:
 *     summary: Create a new project
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *                 description: Project name
 *               description:
 *                 type: string
 *                 description: Project description
 *               order:
 *                 type: number
 *                 description: Project order
 *     responses:
 *       201:
 *         description: Project created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Project'
 *       400:
 *         description: Invalid input
 *       403:
 *         description: Forbidden - User is not Admin or Manager
 *       500:
 *         description: Server error
 */
router.post("/", verifyToken, async (req, res) => {
  try {
    // Check if user is Admin or Manager
    if (req.user.role !== "Admin" && req.user.role !== "Manager") {
      return res.status(403).json({
        error: "Only Admins and Managers can create projects",
      });
    }

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

    const project = new Project({
      ...req.body,
      order: projectOrder,
      owner: req.user.id,
    });
    await project.save();
    res.status(201).json(project);
  } catch (err) {
    console.error("Error creating project:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * @swagger
 * /api/projects/{id}:
 *   put:
 *     summary: Update a project
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Project ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [active, archived]
 *               order:
 *                 type: number
 *     responses:
 *       200:
 *         description: Project updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Project'
 *       400:
 *         description: Invalid input
 *       403:
 *         description: Forbidden - User is not Admin/Manager or not project owner
 *       404:
 *         description: Project not found
 *       500:
 *         description: Server error
 */
router.put("/:id", verifyToken, async (req, res) => {
  try {
    // Check if user is Admin or Manager
    if (req.user.role !== "Admin" && req.user.role !== "Manager") {
      return res.status(403).json({
        error: "Only Admins and Managers can update projects",
      });
    }

    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ error: "Project not found" });
    }

    // Check if user is Admin or the project owner
    if (req.user.role !== "Admin" && project.owner.toString() !== req.user.id) {
      return res.status(403).json({
        error: "Only project owner or Admin can update this project",
      });
    }

    const { name, description, status, order } = req.body;
    // Validate request body
    if (!name || name.trim() === "") {
      return res.status(400).json({ error: "Project name is required" });
    }

    const updatedProject = await Project.findByIdAndUpdate(
      req.params.id,
      { name, description, status, order },
      { new: true }
    );
    res.json(updatedProject);
  } catch (err) {
    console.error("Error updating project:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * @swagger
 * /api/projects/{id}:
 *   delete:
 *     summary: Delete a project
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Project ID
 *     responses:
 *       200:
 *         description: Project deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       403:
 *         description: Forbidden - User is not Admin/Manager or not project owner
 *       404:
 *         description: Project not found
 *       500:
 *         description: Server error
 */
router.delete("/:id", verifyToken, async (req, res) => {
  try {
    // Check if user is Admin or Manager
    if (req.user.role !== "Admin" && req.user.role !== "Manager") {
      return res.status(403).json({
        error: "Only Admins and Managers can delete projects",
      });
    }

    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ error: "Project not found" });
    }

    // Check if user is Admin or the project owner
    if (req.user.role !== "Admin" && project.owner.toString() !== req.user.id) {
      return res.status(403).json({
        error: "Only project owner or Admin can delete this project",
      });
    }

    await Project.findByIdAndDelete(req.params.id);
    // Delete all tasks associated with the project
    await Task.deleteMany({ project: req.params.id });
    res.json({ message: "Project deleted successfully" });
  } catch (err) {
    console.error("Error deleting project:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * @swagger
 * /api/projects/{id}:
 *   get:
 *     summary: Get a single project
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Project ID
 *     responses:
 *       200:
 *         description: Project details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Project'
 *       403:
 *         description: Forbidden - User doesn't have access to the project
 *       404:
 *         description: Project not found
 *       500:
 *         description: Server error
 */
router.get("/:id", verifyToken, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate("tasks")
      .populate("owner", "name email role");

    if (!project) {
      return res.status(404).json({ error: "Project not found" });
    }

    // Admin can see all projects
    if (req.user.role === "Admin") {
      return res.json(project);
    }

    // Manager can only see their own projects
    if (
      req.user.role === "Manager" &&
      project.owner._id.toString() === req.user.id
    ) {
      return res.json(project);
    }

    // Employee can see projects they are assigned to
    if (req.user.role === "Employee") {
      const hasAssignedTask = project.tasks.some(
        (task) =>
          task.assignedTo &&
          task.assignedTo.some(
            (assignee) => assignee.toString() === req.user.id
          )
      );

      if (hasAssignedTask) {
        return res.json(project);
      }
    }

    return res.status(403).json({ error: "Access denied" });
  } catch (err) {
    console.error("Error fetching project:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * @swagger
 * /api/projects:
 *   get:
 *     summary: Get all projects
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of projects
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Project'
 *       500:
 *         description: Server error
 */
router.get("/", verifyToken, async (req, res) => {
  try {
    let projects;

    if (req.user.role === "Admin") {
      // Admin can see all projects
      projects = await Project.find()
        .populate("tasks")
        .populate("owner", "name email role");
    } else if (req.user.role === "Manager") {
      // Manager can only see their own projects
      projects = await Project.find({ owner: req.user.id })
        .populate("tasks")
        .populate("owner", "name email role");
    } else {
      // Employee can see projects they are assigned to
      const tasks = await Task.find({
        assignedTo: req.user.id,
      }).select("project");

      const projectIds = [
        ...new Set(tasks.map((task) => task.project.toString())),
      ];
      projects = await Project.find({ _id: { $in: projectIds } })
        .populate("tasks")
        .populate("owner", "name email role");
    }

    res.json(projects);
  } catch (err) {
    console.error("Error fetching projects:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
