// ============================================================
// AttendX - Global Error Handler Middleware
// Catches all unhandled errors and returns structured responses
// ============================================================

const errorHandler = (err, req, res, next) => {
  // Log error for debugging
  console.error('❌ Error:', err.message);
  if (process.env.NODE_ENV === 'development') {
    console.error(err.stack);
  }

  // Default error values
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';

  // Handle specific MySQL errors
  if (err.code === 'ER_DUP_ENTRY') {
    statusCode = 409;
    message = 'Duplicate entry. This record already exists.';
  }

  if (err.code === 'ER_NO_REFERENCED_ROW_2') {
    statusCode = 400;
    message = 'Referenced record does not exist. Check foreign key values.';
  }

  if (err.code === 'ER_ROW_IS_REFERENCED_2') {
    statusCode = 400;
    message = 'Cannot delete this record. It is referenced by other records.';
  }

  // Handle JWT errors
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token.';
  }

  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token expired. Please login again.';
  }

  // Handle validation errors
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = err.message;
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

module.exports = errorHandler;
