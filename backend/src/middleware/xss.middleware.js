/**
 * XSS (Cross-Site Scripting) Input Sanitization Middleware
 * Recursively strips dangerous HTML tags and script injections from request body, query, and params.
 */

function sanitizeString(str) {
  if (typeof str !== 'string') return str;
  return str
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove <script> tags
    .replace(/on\w+\s*=\s*(['"]?)(.*?)\1/gi, '') // Remove inline event handlers (onerror=, onload=, etc)
    .replace(/javascript\s*:/gi, '') // Remove javascript: pseudo-protocol
    .trim();
}

function sanitizeObject(obj) {
  if (obj === null || typeof obj !== 'object') {
    return typeof obj === 'string' ? sanitizeString(obj) : obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(sanitizeObject);
  }

  const sanitized = {};
  for (const key of Object.keys(obj)) {
    sanitized[key] = sanitizeObject(obj[key]);
  }
  return sanitized;
}

const xssSanitizer = (req, _res, next) => {
  if (req.body) req.body = sanitizeObject(req.body);
  if (req.query) req.query = sanitizeObject(req.query);
  if (req.params) req.params = sanitizeObject(req.params);
  next();
};

module.exports = { xssSanitizer, sanitizeString, sanitizeObject };
