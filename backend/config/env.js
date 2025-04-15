require('dotenv').config();

module.exports = {
  port: process.env.PORT || 5001,
  jwtSecret: process.env.JWT_SECRET || 'defaultsecret',
};