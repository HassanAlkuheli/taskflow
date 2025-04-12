export default (err, req, res, next) => {
  console.error(`[${new Date().toISOString()}] ${err.stack}`);

  // Ensure we're sending a valid JSON response
  return res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
    error: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
};