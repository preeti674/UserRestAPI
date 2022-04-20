const { jwt_secret } = require("../utils/config.js");
const jwt = require("jsonwebtoken");

module.exports = (req, res, next) => {
  try {
    const jwtToken = (req.header("Authorization") || "")
      .split("Bearer ")
      .join("");
    const decodedUserData = jwt.verify(jwtToken, jwt_secret);
    req.user = decodedUserData;
    next();
  } catch (err) {
    res.status(401).send(err);
  }
};
