/**
 * Zod Request Payload Validation Middleware
 */

const validate = (schema) => (req, res, next) => {
  if (!schema) return next();

  const result = schema.safeParse(req.body);
  if (!result.success) {
    const formattedErrors = result.error.errors.map((err) => ({
      field: err.path.join('.'),
      message: err.message,
    }));
    return res.status(400).json({
      error: 'Validation failed',
      details: formattedErrors,
    });
  }

  req.body = result.data;
  next();
};

module.exports = validate;
