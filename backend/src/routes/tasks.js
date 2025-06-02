const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Task = require('../models/Task');
const Board = require('../models/Board');
const Project = require('../models/Project');
const { transformDocument } = require('../utils/transform');
const logger = require('../utils/logger');

/**
 * @typedef {object} Task
 * @property {string} id - Task ID
 * @property {string} title.required - Task title
 * @property {string} description - Task description
 * @property {number} order.required - Task order
 * @property {string} priority - Task priority (Low, Medium, High)
 * @property {string} status - Task status (Todo, InProgress, Done)
 * @property {string} createdAt - Creation date
 * @property {string} dueDate - Due date
 * @property {string} board.required - Board ID
 * @property {Array<User>} assignedTo - Assigned users
 */

/**
 * @typedef {object} TaskResponse
 * @property {string} id - Task ID
 * @property {string} title - Task title
 * @property {string} description - Task description
 * @property {number} order - Task order
 * @property {string} priority - Task priority
 * @property {string} status - Task status
 * @property {string} createdAt - Creation date
 * @property {string} dueDate - Due date
 * @property {string} board - Board ID
 * @property {Array<User>} assignedTo - Assigned users
 */

/**
 * GET /api/tasks/board/{boardId}
 * @summary Get all tasks for a board
 * @tags Tasks
 * @security BearerAuth
 * @param {string} boardId.path.required - Board ID
 * @return {Array<TaskResponse>} 200 - List of tasks
 * @return {object} 404 - Board not found
 * @return {object} 403 - Access denied
 * @return {object} 500 - Server error
 */
router.get('/board/:boardId', auth, async (req, res) => {
  try {
    const board = await Board.findById(req.params.boardId);
    
    if (!board) {
      return res.status(404).json({ message: 'Board not found' });
    }

    // Check if user has access to the project
    const project = await Project.findById(board.project);
    const hasAccess = project.users.some(u => u.user.toString() === req.user.userId);
    if (!hasAccess) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const tasks = await Task.find({ board: req.params.boardId })
      .populate('assignedTo', 'name email')
      .sort('order');

    res.json(tasks.map(transformDocument));
  } catch (error) {
    res.status(500).json({ message: 'Error fetching tasks' });
  }
});

/**
 * @typedef {object} CreateTaskRequest
 * @property {string} title.required - Task title
 * @property {string} description - Task description
 * @property {string} boardId.required - Board ID
 * @property {number} order.required - Task order
 * @property {string} priority - Task priority (Low, Medium, High)
 * @property {string} status - Task status (Todo, InProgress, Done)
 * @property {string} dueDate - Due date
 * @property {Array<string>} assignedTo - Array of user IDs
 */

/**
 * POST /api/tasks
 * @summary Create a new task
 * @tags Tasks
 * @security BearerAuth
 * @param {CreateTaskRequest} request.body.required - Task information
 * @return {TaskResponse} 201 - Task created successfully
 * @return {object} 404 - Board not found
 * @return {object} 403 - Access denied
 * @return {object} 500 - Server error
 */
router.post('/', auth, async (req, res) => {
  try {
    const { title, description, boardId, order, priority, status, dueDate, assignedTo } = req.body;
    logger.debug('Creating task:', { title, boardId, priority, status, userId: req.user.userId });

    if (!title || !boardId) {
      logger.warn('Missing required fields:', { 
        hasTitle: !!title, 
        hasBoardId: !!boardId
      });
      return res.status(400).json({ 
        message: 'Title and boardId are required' 
      });
    }

    const board = await Board.findById(boardId);
    if (!board) {
      logger.warn('Board not found:', { boardId });
      return res.status(404).json({ message: 'Board not found' });
    }

    // Check if user has access to the project
    const project = await Project.findById(board.project);
    const hasAccess = project.users.some(u => u.user.toString() === req.user.userId);
    if (!hasAccess) {
      logger.warn('Access denied:', { projectId: board.project, userId: req.user.userId });
      return res.status(403).json({ message: 'Access denied' });
    }

    // If order is not provided, set it to the next available order
    let taskOrder = order;
    if (taskOrder === undefined) {
      const lastTask = await Task.findOne({ board: boardId })
        .sort({ order: -1 })
        .select('order');
      taskOrder = lastTask ? lastTask.order + 1 : 0;
    }

    const task = new Task({
      title,
      description,
      order: taskOrder,
      priority: priority || 'Medium',
      status: status || 'Todo',
      dueDate,
      board: boardId,
      assignedTo: assignedTo || []
    });

    logger.debug('Saving task:', { task: task.toObject() });
    await task.save();

    // Add task to board
    board.tasks.push(task._id);
    await board.save();

    logger.info('Task created successfully:', { 
      taskId: task._id, 
      boardId, 
      userId: req.user.userId 
    });

    res.status(201).json(transformDocument(task));
  } catch (error) {
    logger.error('Error creating task:', {
      error: error.message,
      stack: error.stack,
      body: req.body,
      userId: req.user.userId
    });
    res.status(500).json({ 
      message: 'Error creating task',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * @typedef {object} UpdateTaskRequest
 * @property {string} id.required - Task ID
 * @property {string} title - Task title
 * @property {string} description - Task description
 * @property {number} order - Task order
 * @property {string} priority - Task priority (Low, Medium, High)
 * @property {string} status - Task status (Pending, InProgress, Completed)
 * @property {string} dueDate - Due date
 * @property {Array<string>} assignedTo - Array of user IDs
 */

/**
 * PUT /api/tasks
 * @summary Update a task
 * @tags Tasks
 * @security BearerAuth
 * @param {UpdateTaskRequest} request.body.required - Task information
 * @return {TaskResponse} 200 - Task updated successfully
 * @return {object} 404 - Task not found
 * @return {object} 403 - Access denied
 * @return {object} 500 - Server error
 */
router.put('/', auth, async (req, res) => {
  try {
    const { id, title, description, order, priority, status, dueDate, assignedTo } = req.body;
    logger.debug('Updating task:', { 
      taskId: id, 
      updates: { title, priority, status, dueDate },
      userId: req.user.userId 
    });

    if (!id) {
      logger.warn('Missing task ID in request body');
      return res.status(400).json({ message: 'Task ID is required' });
    }

    const task = await Task.findById(id);
    if (!task) {
      logger.warn('Task not found:', { taskId: id });
      return res.status(404).json({ message: 'Task not found' });
    }

    // Check if user has access to the project
    const board = await Board.findById(task.board);
    const project = await Project.findById(board.project);
    const hasAccess = project.users.some(u => u.user.toString() === req.user.userId);
    if (!hasAccess) {
      logger.warn('Access denied:', { 
        taskId: id, 
        projectId: board.project, 
        userId: req.user.userId 
      });
      return res.status(403).json({ message: 'Access denied' });
    }

    // Update task fields
    const updates = {};
    if (title !== undefined) updates.title = title;
    if (description !== undefined) updates.description = description;
    if (order !== undefined) updates.order = order;
    if (priority !== undefined) updates.priority = priority;
    if (status !== undefined) updates.status = status;
    if (dueDate !== undefined) updates.dueDate = dueDate;
    if (assignedTo !== undefined) updates.assignedTo = assignedTo;

    logger.debug('Applying updates:', { updates });
    Object.assign(task, updates);

    await task.save();
    logger.info('Task updated successfully:', { 
      taskId: task._id, 
      boardId: task.board,
      userId: req.user.userId 
    });

    res.json(transformDocument(task));
  } catch (error) {
    logger.error('Error updating task:', {
      error: error.message,
      stack: error.stack,
      body: req.body,
      userId: req.user.userId
    });
    res.status(500).json({ 
      message: 'Error updating task',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * DELETE /api/tasks/{id}
 * @summary Delete a task
 * @tags Tasks
 * @security BearerAuth
 * @param {string} id.path.required - Task ID
 * @return {object} 204 - Task deleted successfully
 * @return {object} 404 - Task not found
 * @return {object} 403 - Access denied
 * @return {object} 500 - Server error
 */
router.delete('/:id', auth, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Check if user has access to the project
    const board = await Board.findById(task.board);
    const project = await Project.findById(board.project);
    const hasAccess = project.users.some(u => u.user.toString() === req.user.userId);
    if (!hasAccess) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Remove task from board
    board.tasks = board.tasks.filter(t => t.toString() !== task._id.toString());
    await board.save();

    await task.remove();
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ message: 'Error deleting task' });
  }
});

module.exports = router; 