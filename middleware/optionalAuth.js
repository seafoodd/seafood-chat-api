// const jwt = require("jsonwebtoken");
//
// const optionalAuthenticateToken = (req, res, next) => {
//   const authHeader = req.headers["authorization"];
//   const token = authHeader && authHeader.split(" ")[1];
//
//   if (!token) {
//     return next();
//   }
//
//   jwt.verify(token, process.env.SECRET_KEY, (e, user) => {
//     if (e) {
//       return next();
//     }
//
//     req.user = user;
//     next();
//   });
// };
//
// module.exports = optionalAuthenticateToken;