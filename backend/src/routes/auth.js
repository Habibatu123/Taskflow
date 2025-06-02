const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { transformDocument } = require('../utils/transform');
const AppError = require('../utils/AppError');
const logger = require('../utils/logger');

/**
 * @typedef {object} User
 * @property {string} name.required - User's name
 * @property {string} email.required - User's email
 * @property {string} password.required - User's password
 */

/**
 * @typedef {object} AuthResponse
 * @property {string} token - JWT token
 * @property {User} user - User object
 */

/**
 * POST /api/auth/register
 * @summary Register a new user
 * @tags Auth
 * @param {User} request.body.required - User information
 * @return {AuthResponse} 201 - User created successfully
 * @return {object} 400 - Invalid input
 * @return {object} 500 - Server error
 */
router.post('/register', async (req, res, next) => {
  try {
    const { name, email, password } = req.body;
    logger.debug('Registration attempt:', { email });

    // Validate input
    if (!name || !email || !password) {
      logger.warn('Registration failed - missing fields:', { 
        hasName: !!name, 
        hasEmail: !!email, 
        hasPassword: !!password 
      });
      return next(new AppError('Name, email and password are required', 400));
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      logger.warn('Registration failed - user exists:', { email });
      return next(new AppError('User already exists', 400));
    }

    // Create new user
    const user = new User({
      name,
      email,
      password
    });

    await user.save();
    logger.info('User registered successfully:', { userId: user._id });

    // Generate token
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );

    res.status(201).json({
      token,
      user: transformDocument(user)
    });
  } catch (error) {
    logger.error('Registration error:', {
      error: error.message,
      stack: error.stack
    });
    next(new AppError('Error creating user', 500));
  }
});

/**
 * @typedef {object} LoginRequest
 * @property {string} email.required - User's email
 * @property {string} password.required - User's password
 */

/**
 * POST /api/auth/login
 * @summary Login user
 * @tags Auth
 * @param {LoginRequest} request.body.required - Login credentials
 * @return {AuthResponse} 200 - Login successful
 * @return {object} 400 - Invalid credentials
 * @return {object} 500 - Server error
 */
router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;
    logger.debug('Login attempt:', { email });

    // Validate input
    if (!email || !password) {
      logger.warn('Login failed - missing credentials:', { 
        hasEmail: !!email, 
        hasPassword: !!password 
      });
      return next(new AppError('Email and password are required', 400));
    }

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      logger.warn('Login failed - user not found:', { email });
      return next(new AppError('Invalid credentials', 400));
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      logger.warn('Login failed - invalid password:', { email });
      return next(new AppError('Invalid credentials', 400));
    }

    // Generate token
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );

    logger.info('User logged in successfully:', { userId: user._id });
    res.json({
      token,
      user: transformDocument(user)
    });
  } catch (error) {
    logger.error('Login error:', {
      error: error.message,
      stack: error.stack
    });
    next(new AppError('Error logging in', 500));
  }
});

module.exports = router; 