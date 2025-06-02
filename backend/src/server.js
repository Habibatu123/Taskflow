const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const swaggerJsdoc = require('express-jsdoc-swagger');
const swaggerOptions = require('./config/swagger');
const logger = require('./utils/logger');

// Load environment variables
dotenv.config();

const app = express();

// Initialize Swagger
swaggerJsdoc(app)(swaggerOptions);

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection Options
const mongooseOptions = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
  socketTimeoutMS: 45000, // Close sockets after 45s of inactivity
};

// MongoDB Connection
const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/toodo';
    logger.info('Connecting to MongoDB...', { uri: mongoURI });
    
    await mongoose.connect(mongoURI, mongooseOptions);
    logger.info('Connected to MongoDB successfully');
  } catch (error) {
    logger.error('MongoDB connection error:', {
      error: error.message,
      stack: error.stack
    });
    process.exit(1); // Exit with failure
  }
};

// Connect to MongoDB before starting the server
connectDB().then(() => {
  // Routes
  app.use('/api/auth', require('./routes/auth'));
  app.use('/api/projects', require('./routes/projects'));
  app.use('/api/boards', require('./routes/boards'));
  app.use('/api/tasks', require('./routes/tasks'));

  // Error handling middleware
  app.use((err, req, res, next) => {
    logger.error('Unhandled error:', {
      error: err.message,
      stack: err.stack
    });
    res.status(500).json({ message: 'Something went wrong!' });
  });

  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    logger.info(`Server is running on port ${PORT}`);
    logger.info(`API Documentation available at http://localhost:${PORT}/api-docs`);
  });
}); 