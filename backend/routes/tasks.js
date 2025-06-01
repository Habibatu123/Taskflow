const express = require("express");
const Task = require("../models/Task");
const Project = require("../models/Project");
const { verifyToken } = require("../middleware/auth");
const router = express.Router();

/**
 * @swagger
 * /api/tasks/{projectId}:
 *   post:
 *     summary: Create a new task in a project
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: projectId
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
 *               - title
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [todo, in-progress, completed]
 *               priority:
 *                 type: string
 *                 enum: [low, medium, high]
 *               dueDate:
 *                 type: string
 *                 format: date-time
 *               order:
 *                 type: number
 *     responses:
 *       201:
 *         description: Task created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Task'
 *       400:
 *         description: Invalid input
 *       403:
 *         description: Only project owner can create tasks
 *       404:
 *         description: Project not found
 *       500:
 *         description: Server error
 */
router.post("/:projectId", verifyToken, async (req, res) => {
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

    // Check if user is the project owner
    if (project.owner.toString() !== req.user.id) {
      return res
        .status(403)
        .json({ error: "Only project owner can create tasks" });
    }

    let taskOrder = order;
    if (typeof order !== "number" || order < 0) {
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

/**
 * @swagger
 * /api/tasks/{taskId}:
 *   put:
 *     summary: Update a task
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: taskId
 *         required: true
 *         schema:
 *           type: string
 *         description: Task ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [todo, in-progress, completed]
 *     responses:
 *       200:
 *         description: Task updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Task'
 *       400:
 *         description: Invalid input
 *       403:
 *         description: Insufficient permissions
 *       404:
 *         description: Task not found
 *       500:
 *         description: Server error
 */
router.put("/:taskId", verifyToken, async (req, res) => {
  try {
    const { title, description, status } = req.body;
    const task = await Task.findById(req.params.taskId).populate("project");

    if (!task) {
      return res.status(404).json({ error: "Task not found" });
    }

    const project = await Project.findById(task.project);
    if (!project) {
      return res.status(404).json({ error: "Project not found" });
    }

    const isProjectOwner = project.owner.toString() === req.user.id;
    const isAssignedToTask = task.assignedTo.some(
      (assignee) => assignee && assignee.toString() === req.user.id
    );

    // Project owner can update everything
    if (isProjectOwner) {
      if (title) task.title = title;
      if (description) task.description = description;
      if (status) {
        if (!["todo", "in-progress", "completed"].includes(status)) {
          return res.status(400).json({ error: "Invalid status value" });
        }
        task.status = status;
      }
      await task.save();
      return res.json(task);
    }

    // Assigned employees can only update status
    if (isAssignedToTask) {
      if (status) {
        if (!["todo", "in-progress", "completed"].includes(status)) {
          return res.status(400).json({ error: "Invalid status value" });
        }
        task.status = status;
        await task.save();
        return res.json(task);
      }
      return res.status(403).json({
        error: "Assigned employees can only update task status",
      });
    }

    return res.status(403).json({
      error: "You don't have permission to update this task",
    });
  } catch (err) {
    console.error("Error updating task:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * @swagger
 * /api/tasks/{projectId}:
 *   get:
 *     summary: Get all tasks for a project
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: string
 *         description: Project ID
 *     responses:
 *       200:
 *         description: List of tasks
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Task'
 *       403:
 *         description: Insufficient permissions
 *       404:
 *         description: Project not found
 *       500:
 *         description: Server error
 */
router.get("/:projectId", verifyToken, async (req, res) => {
  try {
    const project = await Project.findById(req.params.projectId);
    if (!project) {
      return res.status(404).json({ error: "Project not found" });
    }
    console.log("Project:", project);
    console.log("User:", req.user);

    // Check if user is the project owner
    const isProjectOwner =
      project.owner && project.owner.toString() === req.user.id;

    // Get all tasks for the project
    const tasks = await Task.find({ project: req.params.projectId })
      .populate("assignedTo")
      .sort({ order: 1 });

    console.log("User ID:", req.user.id);
    console.log("Project Owner:", project.owner);
    console.log("Is Project Owner:", isProjectOwner);

    // Filter tasks based on user's role
    const accessibleTasks = tasks.filter((task) => {
      try {
        // Project owner can see all tasks
        if (isProjectOwner) {
          console.log("Task accessible to project owner:", task._id);
          return true;
        }

        // Check if user is assigned to the task
        if (task.assignedTo) {
          const assigneeIds = Array.isArray(task.assignedTo)
            ? task.assignedTo
            : [task.assignedTo];

          const hasAccess = assigneeIds.some((assignee) => {
            if (!assignee) return false;
            const assigneeId = assignee._id || assignee;
            return assigneeId && assigneeId.toString() === req.user.id;
          });

          console.log("Task access check:", {
            taskId: task._id,
            assigneeIds: assigneeIds.map((a) => a._id || a),
            hasAccess,
          });

          return hasAccess;
        }

        return false;
      } catch (error) {
        console.error("Error checking task access:", error);
        return false;
      }
    });

    res.json(accessibleTasks);
  } catch (err) {
    console.error("Error fetching tasks:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
