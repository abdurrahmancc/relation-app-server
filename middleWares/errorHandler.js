const createError = require("http-errors");

const notFounderHandler = (req, res, next) => {
  next(createError(400, "your request content was not found!!"));
};

const errorHandler = (err, req, res, next) => {
  if (err) {
    res.status(500).send(err.message);
  } else {
    res.status(500).send("there was an error!");
  }
};

module.exports = {
  notFounderHandler,
  errorHandler,
};
