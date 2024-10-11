const jwt = require("jsonwebtoken");
const { prisma } = require("../prisma/prisma-client");

const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const user = jwt.verify(token, process.env.SECRET_KEY);
    const userExists = await prisma.user.findUnique({
      where: { id: user.userId },
    });

    if (!userExists) {
      return res.status(404).json({ error: "User not found." });
    }

    req.user = user;
    next();
  } catch (e) {
    return res.status(403).json({ error: "Invalid token" });
  }
};

const optionalAuthenticateToken = async (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return next();
  }

  try {
    const user = jwt.verify(token, process.env.SECRET_KEY);
    const userExists = await prisma.user.findUnique({
      where: { id: user.userId },
    });

    if (!userExists) {
      return next();
    }

    req.user = user;
    next();
  } catch (e) {
    return next();
  }
};

module.exports = { authenticateToken, optionalAuthenticateToken };