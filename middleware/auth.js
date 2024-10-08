const jwt = require("jsonwebtoken");

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  jwt.verify(token, process.env.SECRET_KEY, (e, user) => {
    if (e) {
      return res.status(403).json({ error: "Invalid token" });
    }

    req.user = user;

    next();
  });
};

const optionalAuthenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return next();
  }

  jwt.verify(token, process.env.SECRET_KEY, (e, user) => {
    if (e) {
      return next();
    }

    req.user = user;
    next();
  });
};
module.exports = { authenticateToken, optionalAuthenticateToken };
