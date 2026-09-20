const express = require('express');
const router = express.Router();
const {
  getAllEvents,
  getEventById,
  createEvent,
  updateEvent,
  deleteEvent,
  generateEventPDF
} = require('../controllers/eventController');
const {
  registerStudent,
  getRegistrationsByEvent
} = require('../controllers/registrationController');
const { verifyToken, requireAdmin, requireAuth } = require('../middleware/authMiddleware');

// Public / Authenticated Read Endpoints
router.get('/', getAllEvents);
router.get('/:id', getEventById);

// Admin Only Endpoints
router.post('/', verifyToken, requireAdmin, createEvent);
router.put('/:id', verifyToken, requireAdmin, updateEvent);
router.delete('/:id', verifyToken, requireAdmin, deleteEvent);
router.get('/:id/pdf', verifyToken, requireAdmin, generateEventPDF);

// Registrations Sub-Endpoints
router.get('/:id/registrations', getRegistrationsByEvent);
router.post('/:id/register', verifyToken, requireAuth, registerStudent);

module.exports = router;
