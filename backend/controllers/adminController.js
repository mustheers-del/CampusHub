const { pool } = require('../db');

// Admin Student Management Controller
const getStudents = async (req, res) => {
  try {
    const { search, course, year } = req.query;

    let query = `
      SELECT 
        u.id, 
        u.full_name, 
        u.email, 
        u.phone, 
        u.course, 
        u.year, 
        u.created_at, 
        COUNT(r.id) AS registration_count
      FROM users u
      LEFT JOIN registrations r ON u.id = r.user_id
      WHERE u.role = 'student'
    `;
    const params = [];

    if (search) {
      query += ` AND (u.full_name LIKE ? OR u.email LIKE ? OR u.phone LIKE ?)`;
      const pattern = `%${search}%`;
      params.push(pattern, pattern, pattern);
    }

    if (course && course !== 'All') {
      query += ` AND u.course = ?`;
      params.push(course);
    }

    if (year && year !== 'All') {
      query += ` AND u.year = ?`;
      params.push(year);
    }

    query += ` GROUP BY u.id ORDER BY u.created_at DESC`;

    const [students] = await pool.query(query, params);

    res.status(200).json({
      success: true,
      data: students.map(s => ({
        ...s,
        registration_count: parseInt(s.registration_count || 0, 10)
      }))
    });
  } catch (error) {
    console.error('Error fetching students:', error);
    res.status(500).json({ success: false, message: 'Server error fetching student records.' });
  }
};

module.exports = {
  getStudents
};
