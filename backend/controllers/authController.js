const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { pool } = require('../db');

const JWT_SECRET = process.env.JWT_SECRET || 'gvms_college_portal_secret_key_2026';

// Student Registration
const register = async (req, res) => {
  try {
    const { full_name, email, password, phone, course, year } = req.body;

    // 1. Validation
    if (!full_name || !email || !password || !course) {
      return res.status(400).json({
        success: false,
        message: 'Please fill in all required fields: Full Name, Email, Password, and Course.'
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      return res.status(400).json({ success: false, message: 'Please enter a valid email address.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters long.' });
    }

    const trimmedEmail = email.trim().toLowerCase();
    const adminEmail = (process.env.ADMIN_EMAIL || 'admin@gvms.edu').toLowerCase();

    if (trimmedEmail === adminEmail) {
      return res.status(400).json({ success: false, message: 'This email address is reserved for administrative use.' });
    }

    // 2. Check if student email is already registered
    const [existing] = await pool.query('SELECT id FROM users WHERE LOWER(email) = ?', [trimmedEmail]);
    if (existing.length > 0) {
      return res.status(400).json({ success: false, message: 'An account with this email address already exists. Please login instead.' });
    }

    // 3. Hash password using bcryptjs
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 4. Insert student user into database
    const insertQuery = `
      INSERT INTO users (full_name, email, password, phone, course, year, role)
      VALUES (?, ?, ?, ?, ?, ?, 'student')
    `;

    const [result] = await pool.query(insertQuery, [
      full_name.trim(),
      trimmedEmail,
      hashedPassword,
      phone ? phone.trim() : '',
      course.trim(),
      year || '1st Year'
    ]);

    const userId = result.insertId;

    // 5. Generate JWT token
    const token = jwt.sign(
      { id: userId, full_name: full_name.trim(), email: trimmedEmail, role: 'student' },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      success: true,
      message: 'Student account created successfully!',
      token,
      user: {
        id: userId,
        full_name: full_name.trim(),
        email: trimmedEmail,
        phone: phone ? phone.trim() : '',
        course: course.trim(),
        year: year || '1st Year',
        role: 'student'
      }
    });
  } catch (error) {
    console.error('Registration Error:', error);
    res.status(500).json({ success: false, message: 'Server error during student registration.' });
  }
};

// Login (Admin or Student)
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please enter both email and password.' });
    }

    const trimmedEmail = email.trim().toLowerCase();
    const adminEmail = (process.env.ADMIN_EMAIL || 'admin@gvms.edu').toLowerCase();
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';

    // 1. Check if user is logging in as Admin via environment variables
    if (trimmedEmail === adminEmail) {
      if (password !== adminPassword) {
        return res.status(400).json({ success: false, message: 'Invalid Admin credentials.' });
      }

      const adminUser = {
        id: 0,
        full_name: 'GVMS Portal Admin',
        email: adminEmail,
        role: 'admin'
      };

      const token = jwt.sign(adminUser, JWT_SECRET, { expiresIn: '7d' });

      return res.status(200).json({
        success: true,
        message: 'Admin login successful!',
        token,
        user: adminUser
      });
    }

    // 2. Otherwise, check Student user in MySQL database
    const [users] = await pool.query('SELECT * FROM users WHERE LOWER(email) = ?', [trimmedEmail]);

    if (users.length === 0) {
      return res.status(400).json({ success: false, message: 'Invalid email or password.' });
    }

    const user = users[0];

    // Verify password using bcryptjs
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Invalid email or password.' });
    }

    const studentUser = {
      id: user.id,
      full_name: user.full_name,
      email: user.email,
      phone: user.phone,
      course: user.course,
      year: user.year,
      role: 'student'
    };

    const token = jwt.sign(studentUser, JWT_SECRET, { expiresIn: '7d' });

    res.status(200).json({
      success: true,
      message: 'Login successful!',
      token,
      user: studentUser
    });
  } catch (error) {
    console.error('Login Error:', error);
    res.status(500).json({ success: false, message: 'Server error during login.' });
  }
};

// Get current logged-in user profile
const getProfile = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    if (req.user.role === 'admin') {
      return res.status(200).json({
        success: true,
        user: {
          id: 0,
          full_name: 'GVMS Portal Admin',
          email: process.env.ADMIN_EMAIL || 'admin@gvms.edu',
          role: 'admin'
        }
      });
    }

    const [users] = await pool.query('SELECT id, full_name, email, phone, course, year, role, created_at FROM users WHERE id = ?', [req.user.id]);

    if (users.length === 0) {
      return res.status(404).json({ success: false, message: 'User profile not found.' });
    }

    res.status(200).json({ success: true, user: users[0] });
  } catch (error) {
    console.error('Get Profile Error:', error);
    res.status(500).json({ success: false, message: 'Server error fetching profile.' });
  }
};

// Update student profile
const updateProfile = async (req, res) => {
  try {
    if (!req.user || req.user.role === 'admin') {
      return res.status(400).json({ success: false, message: 'Admin profile is managed via system environment variables.' });
    }

    const { full_name, phone, course, year } = req.body;

    if (!full_name || !course) {
      return res.status(400).json({ success: false, message: 'Full Name and Course are required.' });
    }

    await pool.query(
      'UPDATE users SET full_name = ?, phone = ?, course = ?, year = ? WHERE id = ?',
      [full_name.trim(), phone ? phone.trim() : '', course.trim(), year || '1st Year', req.user.id]
    );

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully!',
      user: {
        id: req.user.id,
        full_name: full_name.trim(),
        email: req.user.email,
        phone: phone ? phone.trim() : '',
        course: course.trim(),
        year: year || '1st Year',
        role: 'student'
      }
    });
  } catch (error) {
    console.error('Update Profile Error:', error);
    res.status(500).json({ success: false, message: 'Server error updating profile.' });
  }
};

module.exports = {
  register,
  login,
  getProfile,
  updateProfile
};
