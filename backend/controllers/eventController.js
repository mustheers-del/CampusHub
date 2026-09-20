const { pool } = require('../db');
const PDFDocument = require('pdfkit');

// Get all events with optional filters (search, category, status, registration_type)
const getAllEvents = async (req, res) => {
  try {
    const { search, category, status, registration_type } = req.query;

    let query = `
      SELECT 
        e.*, 
        COUNT(r.id) AS registered_count,
        (e.capacity - COUNT(r.id)) AS remaining_seats
      FROM events e
      LEFT JOIN registrations r ON e.id = r.event_id
      WHERE 1=1
    `;
    const params = [];

    if (search) {
      query += ` AND (e.title LIKE ? OR e.description LIKE ? OR e.venue LIKE ?)`;
      const searchPattern = `%${search}%`;
      params.push(searchPattern, searchPattern, searchPattern);
    }

    if (category && category !== 'All') {
      query += ` AND e.category = ?`;
      params.push(category);
    }

    if (status && status !== 'All') {
      query += ` AND e.status = ?`;
      params.push(status);
    }

    if (registration_type && registration_type !== 'All') {
      query += ` AND e.registration_type = ?`;
      params.push(registration_type);
    }

    query += ` GROUP BY e.id ORDER BY e.event_date ASC, e.event_time ASC`;

    const [rows] = await pool.query(query, params);
    
    const formattedRows = rows.map(event => ({
      ...event,
      registered_count: parseInt(event.registered_count || 0, 10),
      remaining_seats: Math.max(0, parseInt(event.remaining_seats || 0, 10)),
      registration_type: event.registration_type || 'Individual',
      max_group_size: parseInt(event.max_group_size || 1, 10)
    }));

    res.status(200).json({ success: true, data: formattedRows });
  } catch (error) {
    console.error('Error fetching events:', error);
    res.status(500).json({ success: false, message: 'Server error while fetching events' });
  }
};

// Get single event details by ID
const getEventById = async (req, res) => {
  try {
    const { id } = req.params;

    const eventQuery = `
      SELECT 
        e.*, 
        COUNT(r.id) AS registered_count,
        (e.capacity - COUNT(r.id)) AS remaining_seats
      FROM events e
      LEFT JOIN registrations r ON e.id = r.event_id
      WHERE e.id = ?
      GROUP BY e.id
    `;

    const [eventRows] = await pool.query(eventQuery, [id]);

    if (eventRows.length === 0) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    const event = {
      ...eventRows[0],
      registered_count: parseInt(eventRows[0].registered_count || 0, 10),
      remaining_seats: Math.max(0, parseInt(eventRows[0].remaining_seats || 0, 10)),
      registration_type: eventRows[0].registration_type || 'Individual',
      max_group_size: parseInt(eventRows[0].max_group_size || 1, 10)
    };

    // Fetch registrations list with members if Group registration
    const [registrations] = await pool.query(
      `SELECT r.*, u.full_name AS registered_by_user 
       FROM registrations r 
       LEFT JOIN users u ON r.user_id = u.id 
       WHERE r.event_id = ? 
       ORDER BY r.registered_at DESC`,
      [id]
    );

    // If group event, attach group members array to each registration
    for (let reg of registrations) {
      if (reg.registration_type === 'Group') {
        const [members] = await pool.query(
          `SELECT * FROM registration_members WHERE registration_id = ?`,
          [reg.id]
        );
        reg.members = members;
      } else {
        reg.members = [];
      }
    }

    event.registrations = registrations;

    res.status(200).json({ success: true, data: event });
  } catch (error) {
    console.error('Error fetching event details:', error);
    res.status(500).json({ success: false, message: 'Server error while fetching event details' });
  }
};

// Create a new event (Admin Only)
const createEvent = async (req, res) => {
  try {
    const { 
      title, 
      description, 
      category, 
      event_date, 
      event_time, 
      venue, 
      capacity, 
      status,
      registration_type,
      max_group_size
    } = req.body;

    if (!title || !category || !event_date || !event_time || !venue || capacity === undefined) {
      return res.status(400).json({ 
        success: false, 
        message: 'Please provide all required fields.' 
      });
    }

    const parsedCapacity = parseInt(capacity, 10);
    if (isNaN(parsedCapacity) || parsedCapacity <= 0) {
      return res.status(400).json({ success: false, message: 'Capacity must be a positive number greater than 0.' });
    }

    const regType = registration_type === 'Group' ? 'Group' : 'Individual';
    const groupSize = regType === 'Group' ? Math.max(1, parseInt(max_group_size || 1, 10)) : 1;

    const insertQuery = `
      INSERT INTO events (title, description, category, event_date, event_time, venue, capacity, status, registration_type, max_group_size)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const [result] = await pool.query(insertQuery, [
      title.trim(),
      description ? description.trim() : '',
      category,
      event_date,
      event_time,
      venue.trim(),
      parsedCapacity,
      status || 'Upcoming',
      regType,
      groupSize
    ]);

    res.status(201).json({
      success: true,
      message: 'Event created successfully!',
      eventId: result.insertId
    });
  } catch (error) {
    console.error('Error creating event:', error);
    res.status(500).json({ success: false, message: 'Server error while creating event' });
  }
};

// Update an existing event (Admin Only)
const updateEvent = async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      title, 
      description, 
      category, 
      event_date, 
      event_time, 
      venue, 
      capacity, 
      status,
      registration_type,
      max_group_size
    } = req.body;

    const [existing] = await pool.query('SELECT * FROM events WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    if (!title || !category || !event_date || !event_time || !venue || capacity === undefined) {
      return res.status(400).json({ success: false, message: 'Please provide all required fields.' });
    }

    const parsedCapacity = parseInt(capacity, 10);
    if (isNaN(parsedCapacity) || parsedCapacity <= 0) {
      return res.status(400).json({ success: false, message: 'Capacity must be a positive number.' });
    }

    const regType = registration_type === 'Group' ? 'Group' : 'Individual';
    const groupSize = regType === 'Group' ? Math.max(1, parseInt(max_group_size || 1, 10)) : 1;

    const updateQuery = `
      UPDATE events 
      SET title = ?, description = ?, category = ?, event_date = ?, event_time = ?, venue = ?, capacity = ?, status = ?, registration_type = ?, max_group_size = ?
      WHERE id = ?
    `;

    await pool.query(updateQuery, [
      title.trim(),
      description ? description.trim() : '',
      category,
      event_date,
      event_time,
      venue.trim(),
      parsedCapacity,
      status || 'Upcoming',
      regType,
      groupSize,
      id
    ]);

    res.status(200).json({ success: true, message: 'Event updated successfully!' });
  } catch (error) {
    console.error('Error updating event:', error);
    res.status(500).json({ success: false, message: 'Server error while updating event' });
  }
};

// Delete an event (Admin Only)
const deleteEvent = async (req, res) => {
  try {
    const { id } = req.params;

    const [existing] = await pool.query('SELECT * FROM events WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    await pool.query('DELETE FROM events WHERE id = ?', [id]);

    res.status(200).json({ success: true, message: 'Event deleted successfully!' });
  } catch (error) {
    console.error('Error deleting event:', error);
    res.status(500).json({ success: false, message: 'Server error while deleting event' });
  }
};

// Generate Official Event PDF (Admin Only)
const generateEventPDF = async (req, res) => {
  try {
    const { id } = req.params;

    const [eventRows] = await pool.query(`
      SELECT e.*, COUNT(r.id) AS registered_count, (e.capacity - COUNT(r.id)) AS remaining_seats
      FROM events e
      LEFT JOIN registrations r ON e.id = r.event_id
      WHERE e.id = ?
      GROUP BY e.id
    `, [id]);

    if (eventRows.length === 0) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    const event = eventRows[0];

    const [registrations] = await pool.query(
      `SELECT * FROM registrations WHERE event_id = ? ORDER BY registered_at DESC`,
      [id]
    );

    for (let reg of registrations) {
      if (reg.registration_type === 'Group') {
        const [members] = await pool.query(`SELECT * FROM registration_members WHERE registration_id = ?`, [reg.id]);
        reg.members = members;
      }
    }

    // Set Response Headers for PDF File Stream
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=GVMS_Event_${event.id}_Report.pdf`);

    const doc = new PDFDocument({ margin: 40 });
    doc.pipe(res);

    // Header Banner
    doc.fillColor('#4f46e5').fontSize(22).text('GVMS COLLEGE PORTAL', { align: 'center' });
    doc.fillColor('#64748b').fontSize(11).text('Official College Event Information & Roster Report', { align: 'center' });
    doc.moveDown(0.5);
    doc.strokeColor('#e2e8f0').lineWidth(1).moveTo(40, doc.y).lineTo(570, doc.y).stroke();
    doc.moveDown(1);

    // Event Details Section
    doc.fillColor('#0f172a').fontSize(16).text(event.title, { underline: true });
    doc.moveDown(0.5);

    doc.fontSize(10).fillColor('#334155');
    doc.text(`Category: ${event.category}   |   Registration Type: ${event.registration_type || 'Individual'}`);
    doc.text(`Date & Time: ${event.event_date} at ${event.event_time}`);
    doc.text(`Venue: ${event.venue}`);
    doc.text(`Status: ${event.status}`);
    doc.text(`Capacity: ${event.capacity}  |  Registered: ${event.registered_count}  |  Remaining: ${Math.max(0, event.remaining_seats)}`);
    doc.moveDown(0.5);

    doc.fillColor('#64748b').fontSize(10).text(`Description: ${event.description || 'N/A'}`);
    doc.moveDown(1);
    doc.strokeColor('#e2e8f0').lineWidth(1).moveTo(40, doc.y).lineTo(570, doc.y).stroke();
    doc.moveDown(1);

    // Registrations List Header
    doc.fillColor('#0f172a').fontSize(14).text(`Registered Roster (${registrations.length} Entries)`);
    doc.moveDown(0.5);

    if (registrations.length === 0) {
      doc.fontSize(10).fillColor('#64748b').text('No student registrations recorded for this event yet.');
    } else {
      registrations.forEach((reg, index) => {
        doc.fontSize(10).fillColor('#4f46e5').text(`${index + 1}. ${reg.student_name} (${reg.student_email})`);
        doc.fontSize(9).fillColor('#334155').text(`   Course: ${reg.student_course} | Type: ${reg.registration_type || 'Individual'} | Date: ${new Date(reg.registered_at).toLocaleString()}`);

        if (reg.registration_type === 'Group' && reg.members && reg.members.length > 0) {
          doc.fontSize(9).fillColor('#059669').text(`   Team Name: "${reg.group_name || 'N/A'}" (Group Size: ${reg.group_size})`);
          doc.fontSize(8.5).fillColor('#334155').text('   Members:');
          reg.members.forEach((m, mIdx) => {
            doc.fontSize(8).fillColor('#475569').text(`      - ${m.member_name} - ${m.member_email} - ${m.member_course || 'Student'}`);
          });
        }
        doc.moveDown(0.5);
      });
    }

    doc.moveDown(2);
    doc.fontSize(8).fillColor('#94a3b8').text(`Report Generated On: ${new Date().toLocaleString()} | GVMS College Portal System`, { align: 'center' });

    doc.end();
  } catch (error) {
    console.error('Error generating event PDF:', error);
    res.status(500).json({ success: false, message: 'Server error generating event PDF report' });
  }
};

module.exports = {
  getAllEvents,
  getEventById,
  createEvent,
  updateEvent,
  deleteEvent,
  generateEventPDF
};
