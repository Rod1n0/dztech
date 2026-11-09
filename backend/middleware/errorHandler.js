/**
 * 404 Not Found handler for undefined API routes.
 */
export const notFoundHandler = (req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.method} ${req.originalUrl} does not exist.`,
  });
};

/**
 * Centralized Express error-handling middleware.
 */
export const errorHandler = (err, _req, res, _next) => {
  // Handle malformed JSON request bodies
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'Malformed JSON payload in request body.',
    });
  }

  // Handle Mongoose invalid ObjectId (CastError)
  if (err.name === 'CastError' && err.kind === 'ObjectId') {
    return res.status(400).json({
      error: 'Bad Request',
      message: `Invalid ID format: "${err.value}". Expected a valid 24-character hexadecimal MongoDB ObjectId.`,
    });
  }

  // Handle Mongoose schema validation errors
  if (err.name === 'ValidationError') {
    const details = Object.values(err.errors).map((e) => e.message);
    return res.status(400).json({
      error: 'Bad Request',
      message: details.join('. '),
      details,
    });
  }

  // Handle MongoDB duplicate key error (e.g., duplicate email)
  if (err.code === 11000) {
    return res.status(409).json({
      error: 'Conflict',
      message: 'An account with this email address already exists.',
    });
  }

  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    error: statusCode === 500 ? 'Internal Server Error' : err.name || 'Error',
    message:
      err.message || 'An unexpected server error occurred. Please try again.',
  });
};
