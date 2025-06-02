const logger = require('../utils/logger');

const errorHandler = (err, req, res, next) => {
  // Log the error details
  logger.error('Error occurred:', {
    error: {
      message: err.message,
      stack: err.stack,
      name: err.name
    },
    request: {
      method: req.method,
      url: req.url,
      headers: req.headers,
      body: req.body,
      params: req.params,
      query: req.query,
      user: req.user
    }
  });

  // Determine the status code
  const statusCode = err.statusCode || 500;

  // Send error response
  res.status(statusCode).json({
    message: statusCode === 500 ? 'Internal Server Error' : err.message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

module.exports = errorHandler; 