const express = require('express');
const router = express.Router();
const { 
  register, 
  login, 
  getProfile, 
  updateProfile 
} = require('../controllers/authController');
const { verifyToken, requireAuth } = require('../middleware/authMiddleware');

router.post('/register', register);
router.post('/login', login);
router.get('/me', verifyToken, requireAuth, getProfile);
router.put('/profile', verifyToken, requireAuth, updateProfile);

module.exports = router;
