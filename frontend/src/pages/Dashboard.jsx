import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import StatCard from '../components/StatCard';
import EventCard from '../components/EventCard';
import RegisterModal from '../components/RegisterModal';
import StudentDashboard from './StudentDashboard';
import { getDashboardStats, registerStudent } from '../services/api';

export default function Dashboard() {
  const { isStudent } = useAuth();

  // If student, delegate to StudentDashboard component
  if (isStudent) {
    return <StudentDashboard />;
  }

  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [selectedRegisterEvent, setSelectedRegisterEvent] = useState(null);

  const loadStats = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await getDashboardStats();
      if (res.success) {
        setStats(res.data);
      } else {
        setError(res.message || 'Failed to load stats');
      }
    } catch (err) {
      setError(err.message || 'Error connecting to backend API');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  const handleRegisterSubmit = async (eventId, registrationData) => {
    await registerStudent(eventId, registrationData);
    loadStats();
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner" />
        <p>Loading Admin Dashboard & Analytics...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card">
        <div className="alert alert-error">
          <strong>Backend Connection Error:</strong> {error}
        </div>
        <p className="empty-desc">
          Please make sure the Express backend server is running on <code>http://localhost:5000</code> and MySQL database is imported.
        </p>
        <button className="btn btn-primary" style={{ marginTop: '1rem' }} onClick={loadStats}>
          🔄 Retry Connection
        </button>
      </div>
    );
  }

  const {
    totalEvents = 0,
    upcomingEvents = 0,
    totalRegistrations = 0,
    totalStudents = 0,
    popularEvent,
    categorySummary = [],
    upcomingEventsList = [],
    recentRegistrations = []
  } = stats || {};

  return (
    <div>
      <div className="page-header">
        <div className="page-header-text">
          <h1>Admin Command Center</h1>
          <p>GVMS College Portal Event Management & Student Analytics</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <Link to="/events" className="btn btn-primary">
            ➕ Manage Events
          </Link>
          <Link to="/admin/students" className="btn btn-secondary">
            👥 Student Directory
          </Link>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="stats-grid">
        <StatCard 
          title="Total Events"
          value={totalEvents}
          description="All created campus events"
          icon="📅"
          color="indigo"
        />
        <StatCard 
          title="Upcoming Events"
          value={upcomingEvents}
          description="Active & scheduled events"
          icon="⏰"
          color="blue"
        />
        <StatCard 
          title="Total Students"
          value={totalStudents}
          description="Registered student accounts"
          icon="👥"
          color="purple"
        />
        <StatCard 
          title="Total Registrations"
          value={totalRegistrations}
          description="Individual & Group sign-ups"
          icon="🎓"
          color="green"
        />
      </div>

      {/* Popular Event Highlight Card */}
      {popularEvent && (
        <div className="card" style={{ backgroundColor: '#f5f3ff', border: '1px solid #ddd6fe', marginBottom: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <span className="category-badge cat-cultural">⭐ Most Registered Event</span>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-navy)', marginTop: '0.4rem' }}>
                {popularEvent.title}
              </h2>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                Category: <strong>{popularEvent.category}</strong> | Total Registrations: <strong>{popularEvent.registration_count} students/teams</strong>
              </p>
            </div>
            <Link to={`/events/${popularEvent.id}`} className="btn btn-primary btn-sm">
              View Event Roster &rarr;
            </Link>
          </div>
        </div>
      )}

      {/* Category Summary */}
      {categorySummary.length > 0 && (
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Events & Registrations by Category</h3>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem' }}>
            {categorySummary.map((cat, idx) => (
              <div key={idx} style={{ padding: '1rem', backgroundColor: 'var(--bg-page)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>{cat.category}</span>
                <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-navy)', marginTop: '0.2rem' }}>
                  {cat.event_count} {cat.event_count === 1 ? 'Event' : 'Events'}
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--primary)', marginTop: '0.25rem' }}>
                  {cat.registration_count} registrations
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upcoming Events Section */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Upcoming Campus Events</h3>
          <Link to="/events" style={{ color: 'var(--primary)', fontWeight: 600, fontSize: '0.875rem', textDecoration: 'none' }}>
            View All ({totalEvents}) &rarr;
          </Link>
        </div>

        {upcomingEventsList.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📅</div>
            <h4 className="empty-title">No upcoming events scheduled</h4>
            <p className="empty-desc">Create campus events from the Manage Events page.</p>
          </div>
        ) : (
          <div className="events-grid">
            {upcomingEventsList.map(event => (
              <EventCard 
                key={event.id}
                event={event}
                onRegister={setSelectedRegisterEvent}
              />
            ))}
          </div>
        )}
      </div>

      {/* Recent Registrations Table */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Recent Student Registrations</h3>
          <Link to="/registrations" style={{ color: 'var(--primary)', fontWeight: 600, fontSize: '0.875rem', textDecoration: 'none' }}>
            View All Registrations &rarr;
          </Link>
        </div>

        {recentRegistrations.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🎓</div>
            <h4 className="empty-title">No registrations recorded yet</h4>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Student / Leader</th>
                  <th>Email</th>
                  <th>Course</th>
                  <th>Type / Group</th>
                  <th>Event Title</th>
                  <th>Registered Date</th>
                </tr>
              </thead>
              <tbody>
                {recentRegistrations.map(reg => (
                  <tr key={reg.id}>
                    <td style={{ fontWeight: 600 }}>{reg.student_name}</td>
                    <td>{reg.student_email}</td>
                    <td>{reg.student_course}</td>
                    <td>
                      <span className={`status-badge ${reg.registration_type === 'Group' ? 'cat-cultural' : 'status-upcoming'}`}>
                        {reg.registration_type === 'Group' ? `👥 ${reg.group_name}` : '👤 Individual'}
                      </span>
                    </td>
                    <td style={{ color: 'var(--primary)', fontWeight: 500 }}>{reg.event_title}</td>
                    <td style={{ color: 'var(--text-muted)' }}>
                      {new Date(reg.registered_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Register Student Modal */}
      {selectedRegisterEvent && (
        <RegisterModal 
          isOpen={!!selectedRegisterEvent}
          event={selectedRegisterEvent}
          onClose={() => setSelectedRegisterEvent(null)}
          onSubmitSuccess={handleRegisterSubmit}
        />
      )}
    </div>
  );
}
