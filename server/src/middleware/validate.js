const { validationResult } = require('express-validator');
const { AppError } = require('./errorHandler');

const validate = (validations) => {
  return async (req, _res, next) => {
    for (const validation of validations) {
      await validation.run(req);
    }

    const errors = validationResult(req);
    if (errors.isEmpty()) {
      return next();
    }

    const messages = errors.array().map((e) => e.msg);
    next(new AppError(messages.join(', '), 400));
  };
};

module.exports = { validate };
