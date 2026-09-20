const express = require('express');
const router = express.Router();
const {
  getAllRegistrations,
  getMyRegistrations,
  deleteRegistration
} = require('../controllers/registrationController');
const { verifyToken, requireAdmin, requireAuth } = require('../middleware/authMiddleware');

// Student: Get logged-in user's registrations
router.get('/my-registrations', verifyToken, requireAuth, getMyRegistrations);

// Admin: Get all student registrations
router.get('/', verifyToken, requireAdmin, getAllRegistrations);

// Delete/Cancel Registration (Admin or Owner Student)
router.delete('/:id', verifyToken, requireAuth, deleteRegistration);

module.exports = router;
