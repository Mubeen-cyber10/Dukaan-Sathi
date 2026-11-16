class HttpError extends Error {
  constructor(status, code, message, fields) {
    super(message);
    this.status = status;
    this.code = code;
    this.fields = fields;
  }
}

function notFound() {
  return new HttpError(404, 'NOT_FOUND', 'Resource not found');
}

function rateLimitResponse(req, res) {
  res.status(429).json({ error: { code: 'RATE_LIMITED', message: 'Too many attempts. Please try again later.' } });
}

module.exports = { HttpError, notFound, rateLimitResponse };
