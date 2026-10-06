// Wraps an async Express route handler so a rejected promise (e.g. a
// transient MongoDB network error) is forwarded to next(err) and handled by
// the global error middleware, instead of becoming an unhandled promise
// rejection that crashes the whole process.
function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

module.exports = { asyncHandler };
