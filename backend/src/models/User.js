const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const logger = require('../utils/logger');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  try {
    if (!this.isModified('password')) return next();
    
    logger.debug('Hashing password for user:', { email: this.email });
    this.password = await bcrypt.hash(this.password, 10);
    next();
  } catch (error) {
    logger.error('Error hashing password:', {
      error: error.message,
      stack: error.stack,
      email: this.email
    });
    next(error);
  }
});

// Method to compare password
userSchema.methods.comparePassword = async function(candidatePassword) {
  try {
    logger.debug('Comparing password for user:', { email: this.email });
    const isMatch = await bcrypt.compare(candidatePassword, this.password);
    return isMatch;
  } catch (error) {
    logger.error('Error comparing password:', {
      error: error.message,
      stack: error.stack,
      email: this.email
    });
    throw error;
  }
};

module.exports = mongoose.model('User', userSchema); 