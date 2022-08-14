const jwt = require("jsonwebtoken");

const verifyJWT = (req, res, next) => {
  const { authorization } = req.headers;
  // console.log(authorization);
  if (!authorization) {
    next("UnAuthorized access....");
  }
  try {
    const token = authorization.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
    const { userName, userId } = decoded;
    req.userName = userName;
    req.userId = userId;
    next();
  } catch (error) {
    next("Forbidden access");
  }
};

module.exports = verifyJWT;
