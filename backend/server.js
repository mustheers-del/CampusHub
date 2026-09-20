const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { testConnection } = require('./db');

const authRoutes = require('./routes/authRoutes');
const adminRoutes = require('./routes/adminRoutes');
const eventRoutes = require('./routes/eventRoutes');
const registrationRoutes = require('./routes/registrationRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/registrations', registrationRoutes);
app.use('/api/dashboard', dashboardRoutes);

// Root & Health Check Endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to GVMS College Portal API - Campus Event Management Backend',
    status: 'Running',
    timestamp: new Date().toISOString()
  });
});

// 404 Route Handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'API Endpoint Not Found' });
});

// Start Server
app.listen(PORT, async () => {
  console.log(`🚀 GVMS College Portal Backend Server running on http://localhost:${PORT}`);
  await testConnection();
});
