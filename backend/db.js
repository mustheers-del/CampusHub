const mysql = require('mysql2/promise');
const dotenv = require('dotenv');

dotenv.config();

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'campushub',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Helper function to test DB connection on server startup
async function testConnection() {
  try {
    const connection = await pool.getConnection();
    console.log('✅ Connected to MySQL Database successfully:', process.env.DB_NAME || 'campushub');
    connection.release();
  } catch (error) {
    console.error('❌ Error connecting to MySQL Database:', error.message);
    console.error('👉 Please make sure MySQL service is running and credentials in backend/.env are correct.');
  }
}

module.exports = {
  pool,
  testConnection
};
