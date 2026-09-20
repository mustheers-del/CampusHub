const { pool } = require('../db');

// Get overview dashboard statistics
const getDashboardStats = async (req, res) => {
  try {
    // 1. Total events count
    const [totalEventsResult] = await pool.query('SELECT COUNT(*) AS count FROM events');
    const totalEvents = totalEventsResult[0].count;

    // 2. Upcoming events count
    const [upcomingEventsResult] = await pool.query(
      `SELECT COUNT(*) AS count FROM events WHERE status = 'Upcoming' AND event_date >= CURDATE()`
    );
    const upcomingEvents = upcomingEventsResult[0].count;

    // 3. Total registrations count
    const [totalRegistrationsResult] = await pool.query('SELECT COUNT(*) AS count FROM registrations');
    const totalRegistrations = totalRegistrationsResult[0].count;

    // 4. Total registered students count in users table
    const [totalStudentsResult] = await pool.query(`SELECT COUNT(*) AS count FROM users WHERE role = 'student'`);
    const totalStudents = totalStudentsResult[0].count;

    // 5. Popular Event (highest registration count)
    const [popularEventResult] = await pool.query(`
      SELECT 
        e.id, 
        e.title, 
        e.category, 
        e.event_date,
        COUNT(r.id) AS registration_count
      FROM events e
      LEFT JOIN registrations r ON e.id = r.event_id
      GROUP BY e.id
      ORDER BY registration_count DESC, e.id ASC
      LIMIT 1
    `);
    const popularEvent = popularEventResult.length > 0 ? popularEventResult[0] : null;

    // 6. Category breakdown summary
    const [categorySummary] = await pool.query(`
      SELECT 
        e.category, 
        COUNT(e.id) AS event_count,
        COUNT(r.id) AS registration_count
      FROM events e
      LEFT JOIN registrations r ON e.id = r.event_id
      GROUP BY e.category
      ORDER BY event_count DESC
    `);

    // 7. Upcoming events list (top 5)
    const [upcomingList] = await pool.query(`
      SELECT 
        e.*, 
        COUNT(r.id) AS registered_count,
        (e.capacity - COUNT(r.id)) AS remaining_seats
      FROM events e
      LEFT JOIN registrations r ON e.id = r.event_id
      WHERE e.event_date >= CURDATE()
      GROUP BY e.id
      ORDER BY e.event_date ASC, e.event_time ASC
      LIMIT 5
    `);

    const formattedUpcomingList = upcomingList.map(event => ({
      ...event,
      registered_count: parseInt(event.registered_count || 0, 10),
      remaining_seats: Math.max(0, parseInt(event.remaining_seats || 0, 10)),
      registration_type: event.registration_type || 'Individual'
    }));

    // 8. Recent registrations list (top 5)
    const [recentRegistrations] = await pool.query(`
      SELECT 
        r.id,
        r.student_name,
        r.student_email,
        r.student_course,
        r.registration_type,
        r.group_name,
        r.registered_at,
        e.title AS event_title,
        e.category AS event_category
      FROM registrations r
      JOIN events e ON r.event_id = e.id
      ORDER BY r.registered_at DESC
      LIMIT 5
    `);

    res.status(200).json({
      success: true,
      data: {
        totalEvents,
        upcomingEvents,
        totalRegistrations,
        totalStudents,
        popularEvent,
        categorySummary,
        upcomingEventsList: formattedUpcomingList,
        recentRegistrations
      }
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({ success: false, message: 'Server error while fetching dashboard statistics.' });
  }
};

module.exports = {
  getDashboardStats
};
