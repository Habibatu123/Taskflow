const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Project = require('../models/Project');
const User = require('../models/User');
const { transformDocument } = require('../utils/transform');
const AppError = require('../utils/AppError');
const logger = require('../utils/logger');

/**
 * @typedef {object} Project
 * @property {string} name.required - Project name
 * @property {string} description - Project description
 * @property {string} createdAt - Creation date
 * @property {Array<User>} users - Project users
 * @property {Array<Board>} boards - Project boards
 */

/**
 * @typedef {object} ProjectResponse
 * @property {string} id - Project ID
 * @property {string} name - Project name
 * @property {string} description - Project description
 * @property {string} createdAt - Creation date
 */

/**
 * GET /api/projects
 * @summary Get all projects for the authenticated user
 * @tags Projects
 * @security BearerAuth
 * @return {Array<ProjectResponse>} 200 - List of projects
 * @return {object} 500 - Server error
 */
router.get('/', auth, async (req, res, next) => {
  try {
    logger.debug('Fetching projects for user:', { userId: req.user.userId });

    const projects = await Project.find({
      'users.user': req.user.userId
    }).select('name createdAt');

    logger.info('Projects fetched successfully', { count: projects.length });
    res.json(projects.map(transformDocument));
  } catch (error) {
    logger.error('Error fetching projects:', error);
    next(new AppError('Error fetching projects', 500));
  }
});

/**
 * GET /api/projects/{id}
 * @summary Get a specific project
 * @tags Projects
 * @security BearerAuth
 * @param {string} id.path.required - Project ID
 * @return {Project} 200 - Project details
 * @return {object} 404 - Project not found
 * @return {object} 403 - Access denied
 * @return {object} 500 - Server error
 */
router.get('/:id', auth, async (req, res, next) => {
  try {
    logger.debug('Fetching project:', { projectId: req.params.id, userId: req.user.userId });

    const project = await Project.findById(req.params.id)
      .populate('users.user', 'name email')
      .populate({
        path: 'boards',
        populate: {
          path: 'tasks',
          populate: {
            path: 'assignedTo',
            select: 'name email'
          }
        }
      });

    if (!project) {
      logger.warn('Project not found:', { projectId: req.params.id });
      return next(new AppError('Project not found', 404));
    }

    // Check if user has access to the project
    const hasAccess = project.users.some(u => u.user._id.toString() === req.user.userId);
    if (!hasAccess) {
      logger.warn('Access denied to project:', { projectId: req.params.id, userId: req.user.userId });
      return next(new AppError('Access denied', 403));
    }

    logger.info('Project fetched successfully', { projectId: req.params.id });
    res.json(transformDocument(project));
  } catch (error) {
    logger.error('Error fetching project:', error);
    next(new AppError('Error fetching project', 500));
  }
});

/**
 * @typedef {object} CreateProjectRequest
 * @property {string} name.required - Project name
 * @property {string} description - Project description
 */

/**
 * POST /api/projects
 * @summary Create a new project
 * @tags Projects
 * @security BearerAuth
 * @param {CreateProjectRequest} request.body.required - Project information
 * @return {Project} 201 - Project created successfully
 * @return {object} 500 - Server error
 */
router.post('/', auth, async (req, res, next) => {
  try {
    const { name, description } = req.body;
    logger.debug('Creating new project:', { name, userId: req.user.userId });

    const project = new Project({
      name,
      description,
      users: [{
        user: req.user.userId,
        role: 'Manager'
      }]
    });

    await project.save();
    logger.info('Project created successfully', { projectId: project._id });

    res.status(201).json(transformDocument(project));
  } catch (error) {
    logger.error('Error creating project:', error);
    next(new AppError('Error creating project', 500));
  }
});

/**
 * DELETE /api/projects/{id}
 * @summary Delete a project
 * @tags Projects
 * @security BearerAuth
 * @param {string} id.path.required - Project ID
 * @return {object} 204 - Project deleted successfully
 * @return {object} 404 - Project not found
 * @return {object} 403 - Access denied
 * @return {object} 500 - Server error
 */
router.delete('/:id', auth, async (req, res, next) => {
  try {
    logger.debug('Deleting project:', { projectId: req.params.id, userId: req.user.userId });

    const project = await Project.findById(req.params.id);

    if (!project) {
      logger.warn('Project not found:', { projectId: req.params.id });
      return next(new AppError('Project not found', 404));
    }

    // Check if user is a manager
    const userRole = project.users.find(u => u.user.toString() === req.user.userId);
    if (!userRole || userRole.role !== 'Manager') {
      logger.warn('Unauthorized project deletion attempt:', { 
        projectId: req.params.id, 
        userId: req.user.userId 
      });
      return next(new AppError('Only managers can delete projects', 403));
    }

    await Project.deleteOne({ _id: req.params.id });
    logger.info('Project deleted successfully', { projectId: req.params.id });
    res.status(204).send();
  } catch (error) {
    logger.error('Error deleting project:', error);
    next(new AppError('Error deleting project', 500));
  }
});

module.exports = router; 