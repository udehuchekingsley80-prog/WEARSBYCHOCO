const integerCentsValidator = {
  validator: Number.isInteger,
  message: '{PATH} must be an integer number of cents',
};

module.exports = { integerCentsValidator };
