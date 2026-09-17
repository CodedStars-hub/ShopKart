const jwt = require("jsonwebtoken");

const generateToken = (customerId) => {
  return jwt.sign(
    { sub: customerId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || "1d" }
  );
};

module.exports = generateToken;
