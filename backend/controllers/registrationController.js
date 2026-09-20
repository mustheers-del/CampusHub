const { pool } = require('../db');

// Register a student (Individual or Group) for an event
const registerStudent = async (req, res) => {
  try {
    const event_id = req.params.id;
    const { 
      student_name, 
      student_email, 
      student_course, 
      registration_type = 'Individual',
      group_name,
      members = []
    } = req.body;

    const user_id = req.user ? req.user.id : null;

    // 1. Check if event exists
    const [eventRows] = await pool.query('SELECT * FROM events WHERE id = ?', [event_id]);
    if (eventRows.length === 0) {
      return res.status(404).json({ success: false, message: 'Event not found.' });
    }

    const event = eventRows[0];
    const isGroupRegistration = (event.registration_type === 'Group' || registration_type === 'Group');

    // 2. Individual vs Group Validation
    if (!isGroupRegistration) {
      // Individual Registration Validation
      if (!student_name || !student_email || !student_course) {
        return res.status(400).json({
          success: false,
          message: 'All fields are required: Full Name, Email, and Course.'
        });
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(student_email.trim())) {
        return res.status(400).json({ success: false, message: 'Please provide a valid email address.' });
      }

      // Check event capacity
      const [countRows] = await pool.query('SELECT COUNT(*) AS registered_count FROM registrations WHERE event_id = ?', [event_id]);
      if (countRows[0].registered_count >= event.capacity) {
        return res.status(400).json({
          success: false,
          message: `Registration failed: "${event.title}" is already at full capacity (${event.capacity} seats).`
        });
      }

      // Check duplicate registration
      const [existingStudent] = await pool.query(
        'SELECT id FROM registrations WHERE event_id = ? AND LOWER(student_email) = LOWER(?)',
        [event_id, student_email.trim()]
      );

      if (existingStudent.length > 0) {
        return res.status(400).json({
          success: false,
          message: `Registration failed: Student (${student_email.trim()}) is already registered for this event.`
        });
      }

      // Insert Individual Registration
      const insertQuery = `
        INSERT INTO registrations (event_id, user_id, student_name, student_email, student_course, registration_type, group_name, group_size)
        VALUES (?, ?, ?, ?, ?, 'Individual', NULL, 1)
      `;

      const [result] = await pool.query(insertQuery, [
        event_id,
        user_id > 0 ? user_id : null,
        student_name.trim(),
        student_email.trim().toLowerCase(),
        student_course.trim()
      ]);

      return res.status(201).json({
        success: true,
        message: 'Student registered successfully for event!',
        registrationId: result.insertId
      });

    } else {
      // Group Registration Validation (NO MEMBER LIMIT)
      if (!group_name || !group_name.trim()) {
        return res.status(400).json({ success: false, message: 'Team/Group Name is required for group events.' });
      }

      if (!Array.isArray(members) || members.length === 0) {
        return res.status(400).json({ success: false, message: 'Please provide team member details.' });
      }

      // Check event capacity
      const [countRows] = await pool.query('SELECT COUNT(*) AS registered_count FROM registrations WHERE event_id = ?', [event_id]);
      if (countRows[0].registered_count >= event.capacity) {
        return res.status(400).json({
          success: false,
          message: `Registration failed: "${event.title}" is already at full capacity (${event.capacity} seats).`
        });
      }

      const teamLeaderName = student_name || (req.user ? req.user.full_name : members[0].member_name);
      const teamLeaderEmail = student_email || (req.user ? req.user.email : members[0].member_email);

      // Check if team leader is already registered
      const [existingLeader] = await pool.query(
        'SELECT id FROM registrations WHERE event_id = ? AND LOWER(student_email) = LOWER(?)',
        [event_id, teamLeaderEmail.trim()]
      );

      if (existingLeader.length > 0) {
        return res.status(400).json({
          success: false,
          message: `Registration failed: Team leader (${teamLeaderEmail.trim()}) is already registered for this event.`
        });
      }

      // Insert Group Registration Record into registrations
      const insertQuery = `
        INSERT INTO registrations (event_id, user_id, student_name, student_email, student_course, registration_type, group_name, group_size)
        VALUES (?, ?, ?, ?, ?, 'Group', ?, ?)
      `;

      const [result] = await pool.query(insertQuery, [
        event_id,
        user_id > 0 ? user_id : null,
        teamLeaderName.trim(),
        teamLeaderEmail.trim().toLowerCase(),
        student_course || (req.user ? req.user.course : 'Student'),
        group_name.trim(),
        members.length
      ]);

      const registrationId = result.insertId;

      // Insert Group Members into registration_members (Unlimited Members Supported)
      for (let m of members) {
        if (m.member_name && m.member_email) {
          await pool.query(
            `INSERT INTO registration_members (registration_id, member_name, member_email, member_phone, member_course)
             VALUES (?, ?, ?, ?, ?)`,
            [
              registrationId,
              m.member_name.trim(),
              m.member_email.trim().toLowerCase(),
              m.member_phone ? m.member_phone.trim() : '',
              m.member_course ? m.member_course.trim() : ''
            ]
          );
        }
      }

      return res.status(201).json({
        success: true,
        message: `Group "${group_name.trim()}" (${members.length} members) successfully registered for ${event.title}!`,
        registrationId
      });
    }

  } catch (error) {
    console.error('Error registering student/group:', error);
    res.status(500).json({ success: false, message: 'Server error while registering for event.' });
  }
};

// Get registrations for a specific event
const getRegistrationsByEvent = async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await pool.query(
      'SELECT * FROM registrations WHERE event_id = ? ORDER BY registered_at DESC',
      [id]
    );

    for (let reg of rows) {
      if (reg.registration_type === 'Group') {
        const [members] = await pool.query('SELECT * FROM registration_members WHERE registration_id = ?', [reg.id]);
        reg.members = members;
      }
    }

    res.status(200).json({ success: true, data: rows });
  } catch (error) {
    console.error('Error fetching registrations:', error);
    res.status(500).json({ success: false, message: 'Server error while fetching registrations.' });
  }
};

// Get all registrations across all events (Admin view)
const getAllRegistrations = async (req, res) => {
  try {
    const query = `
      SELECT 
        r.id,
        r.event_id,
        r.user_id,
        r.student_name,
        r.student_email,
        r.student_course,
        r.registration_type,
        r.group_name,
        r.group_size,
        r.registered_at,
        e.title AS event_title,
        e.category AS event_category,
        e.event_date,
        e.venue AS event_venue
      FROM registrations r
      JOIN events e ON r.event_id = e.id
      ORDER BY r.registered_at DESC
    `;

    const [rows] = await pool.query(query);

    for (let reg of rows) {
      if (reg.registration_type === 'Group') {
        const [members] = await pool.query('SELECT * FROM registration_members WHERE registration_id = ?', [reg.id]);
        reg.members = members;
      }
    }

    res.status(200).json({ success: true, data: rows });
  } catch (error) {
    console.error('Error fetching all registrations:', error);
    res.status(500).json({ success: false, message: 'Server error while fetching all registrations.' });
  }
};

// Get registrations belonging to logged-in student (`/my-registrations`)
const getMyRegistrations = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const query = `
      SELECT 
        r.id,
        r.event_id,
        r.student_name,
        r.student_email,
        r.student_course,
        r.registration_type,
        r.group_name,
        r.group_size,
        r.registered_at,
        e.title AS event_title,
        e.category AS event_category,
        e.event_date,
        e.event_time,
        e.venue AS event_venue,
        e.status AS event_status
      FROM registrations r
      JOIN events e ON r.event_id = e.id
      WHERE r.user_id = ? OR LOWER(r.student_email) = LOWER(?)
      ORDER BY r.registered_at DESC
    `;

    const [rows] = await pool.query(query, [req.user.id, req.user.email]);

    for (let reg of rows) {
      if (reg.registration_type === 'Group') {
        const [members] = await pool.query('SELECT * FROM registration_members WHERE registration_id = ?', [reg.id]);
        reg.members = members;
      }
    }

    res.status(200).json({ success: true, data: rows });
  } catch (error) {
    console.error('Error fetching my registrations:', error);
    res.status(500).json({ success: false, message: 'Server error fetching your registrations.' });
  }
};

// Delete a student registration
const deleteRegistration = async (req, res) => {
  try {
    const { id } = req.params;

    const [existing] = await pool.query('SELECT * FROM registrations WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Registration not found.' });
    }

    const registration = existing[0];

    // Authorization: Admin can delete any registration; Student can only delete their own
    if (req.user.role !== 'admin' && registration.user_id !== req.user.id && registration.student_email.toLowerCase() !== req.user.email.toLowerCase()) {
      return res.status(403).json({ success: false, message: 'Forbidden. You can only cancel your own registrations.' });
    }

    await pool.query('DELETE FROM registrations WHERE id = ?', [id]);

    res.status(200).json({ success: true, message: 'Registration cancelled/deleted successfully!' });
  } catch (error) {
    console.error('Error deleting registration:', error);
    res.status(500).json({ success: false, message: 'Server error while deleting registration.' });
  }
};

module.exports = {
  registerStudent,
  getRegistrationsByEvent,
  getAllRegistrations,
  getMyRegistrations,
  deleteRegistration
};
