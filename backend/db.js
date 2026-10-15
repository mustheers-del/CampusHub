const { Sequelize } = require('sequelize');
const dotenv = require('dotenv');

dotenv.config();

// Initialize Sequelize with your database credentials
const sequelize = new Sequelize(
  process.env.DB_NAME || 'campushub',
  process.env.DB_USER || 'root',
  process.env.DB_PASSWORD || '',
  {
    host: process.env.DB_HOST || 'localhost',
    dialect: 'mysql',
    logging: false
  }
);

// Helper function to test DB connection on server startup
async function testConnection() {
  try {
    await sequelize.authenticate();
    console.log('✅ Connected to MySQL Database successfully using Sequelize:', process.env.DB_NAME || 'campushub');
  } catch (error) {
    console.error('❌ Error connecting to MySQL Database with Sequelize:', error.message);
  }
}

module.exports = {
  sequelize,
  testConnection
};