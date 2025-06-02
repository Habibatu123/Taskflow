const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Board = require('../models/Board');
const Project = require('../models/Project');
const { transformDocument } = require('../utils/transform');
const logger = require('../utils/logger');

/**
 * @typedef {object} Board
 * @property {string} id - Board ID
 * @property {string} name.required - Board name
 * @property {string} description - Board description
 * @property {number} order.required - Board order
 * @property {string} createdAt - Creation date
 * @property {string} project.required - Project ID
 * @property {Array<Task>} tasks - Board tasks
 */

/**
 * @typedef {object} BoardResponse
 * @property {string} id - Board ID
 * @property {string} name - Board name
 * @property {string} description - Board description
 * @property {number} order - Board order
 * @property {string} createdAt - Creation date
 * @property {string} project - Project ID
 * @property {Array<Task>} tasks - Board tasks
 */

/**
 * GET /api/boards/project/{projectId}
 * @summary Get all boards for a project
 * @tags Boards
 * @security BearerAuth
 * @param {string} projectId.path.required - Project ID
 * @return {Array<BoardResponse>} 200 - List of boards
 * @return {object} 404 - Project not found
 * @return {object} 403 - Access denied
 * @return {object} 500 - Server error
 */
router.get('/project/:projectId', auth, async (req, res) => {
  try {
    const project = await Project.findById(req.params.projectId);
    
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Check if user has access to the project
    const hasAccess = project.users.some(u => u.user.toString() === req.user.userId);
    if (!hasAccess) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const boards = await Board.find({ project: req.params.projectId })
      .populate('tasks')
      .sort('order');

    res.json(boards.map(transformDocument));
  } catch (error) {
    res.status(500).json({ message: 'Error fetching boards' });
  }
});

/**
 * @typedef {object} CreateBoardRequest
 * @property {string} name.required - Board name
 * @property {string} description - Board description
 * @property {string} projectId.required - Project ID
 * @property {number} order.required - Board order
 */

/**
 * POST /api/boards
 * @summary Create a new board
 * @tags Boards
 * @security BearerAuth
 * @param {CreateBoardRequest} request.body.required - Board information
 * @return {BoardResponse} 201 - Board created successfully
 * @return {object} 404 - Project not found
 * @return {object} 403 - Access denied
 * @return {object} 500 - Server error
 */
router.post('/', auth, async (req, res) => {
  try {
    const { name, description, projectId, order } = req.body;
    logger.debug('Creating board:', { name, projectId, order, userId: req.user.userId });

    if (!name || !projectId) {
      logger.warn('Missing required fields:', { 
        hasName: !!name, 
        hasProjectId: !!projectId
      });
      return res.status(400).json({ 
        message: 'Name and projectId are required' 
      });
    }

    const project = await Project.findById(projectId);
    if (!project) {
      logger.warn('Project not found:', { projectId });
      return res.status(404).json({ message: 'Project not found' });
    }

    // Check if user has access to the project
    const hasAccess = project.users.some(u => u.user.toString() === req.user.userId);
    if (!hasAccess) {
      logger.warn('Access denied:', { projectId, userId: req.user.userId });
      return res.status(403).json({ message: 'Access denied' });
    }

    // If order is not provided, set it to the next available order
    let boardOrder = order;
    if (boardOrder === undefined) {
      const lastBoard = await Board.findOne({ project: projectId })
        .sort({ order: -1 })
        .select('order');
      boardOrder = lastBoard ? lastBoard.order + 1 : 0;
    }

    const board = new Board({
      name,
      description,
      order: boardOrder,
      project: projectId
    });

    logger.debug('Saving board:', { board: board.toObject() });
    await board.save();

    // Add board to project
    project.boards.push(board._id);
    await project.save();

    logger.info('Board created successfully:', { 
      boardId: board._id, 
      projectId, 
      userId: req.user.userId 
    });

    res.status(201).json(transformDocument(board));
  } catch (error) {
    logger.error('Error creating board:', {
      error: error.message,
      stack: error.stack,
      body: req.body,
      userId: req.user.userId
    });
    res.status(500).json({ 
      message: 'Error creating board',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * @typedef {object} UpdateBoardRequest
 * @property {string} name - Board name
 * @property {string} description - Board description
 * @property {number} order - Board order
 */

/**
 * PUT /api/boards/{id}
 * @summary Update a board
 * @tags Boards
 * @security BearerAuth
 * @param {string} id.path.required - Board ID
 * @param {UpdateBoardRequest} request.body.required - Board information
 * @return {BoardResponse} 200 - Board updated successfully
 * @return {object} 404 - Board not found
 * @return {object} 403 - Access denied
 * @return {object} 500 - Server error
 */
router.put('/:id', auth, async (req, res) => {
  try {
    const { name, description, order } = req.body;
    const board = await Board.findById(req.params.id);

    if (!board) {
      return res.status(404).json({ message: 'Board not found' });
    }

    // Check if user has access to the project
    const project = await Project.findById(board.project);
    const hasAccess = project.users.some(u => u.user.toString() === req.user.userId);
    if (!hasAccess) {
      return res.status(403).json({ message: 'Access denied' });
    }

    if (name) board.name = name;
    if (description !== undefined) board.description = description;
    if (order !== undefined) board.order = order;

    await board.save();
    res.json(transformDocument(board));
  } catch (error) {
    res.status(500).json({ message: 'Error updating board' });
  }
});

/**
 * DELETE /api/boards/{id}
 * @summary Delete a board
 * @tags Boards
 * @security BearerAuth
 * @param {string} id.path.required - Board ID
 * @return {object} 204 - Board deleted successfully
 * @return {object} 404 - Board not found
 * @return {object} 403 - Access denied
 * @return {object} 500 - Server error
 */
router.delete('/:id', auth, async (req, res) => {
  try {
    const board = await Board.findById(req.params.id);

    if (!board) {
      return res.status(404).json({ message: 'Board not found' });
    }

    // Check if user has access to the project
    const project = await Project.findById(board.project);
    const hasAccess = project.users.some(u => u.user.toString() === req.user.userId);
    if (!hasAccess) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Remove board from project
    project.boards = project.boards.filter(b => b.toString() !== board._id.toString());
    await project.save();

    await board.remove();
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ message: 'Error deleting board' });
  }
});

module.exports = router; 