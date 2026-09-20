const express = require('express');
const router = express.Router();
const { getStudents } = require('../controllers/adminController');
const { verifyToken, requireAdmin } = require('../middleware/authMiddleware');

router.get('/students', verifyToken, requireAdmin, getStudents);

module.exports = router;
