require('dotenv').config();
const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect('mongodb+srv://ecoalliance33:cXIdVOePhB0RCArx@automatizaciondb.mj72mym.mongodb.net/', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = {
  port: process.env.PORT || 5001,
  jwtSecret: process.env.JWT_SECRET || 'defaultsecret',
  connectDB,
};