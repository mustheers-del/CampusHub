import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import StatCard from '../components/StatCard';
import EventCard from '../components/EventCard';
import RegisterModal from '../components/RegisterModal';
import { getEvents, getMyRegistrations, registerStudent } from '../services/api';

export default function StudentDashboard() {
  const { user } = useAuth();
  const [events, setEvents] = useState([]);
  const [myRegistrations, setMyRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [registeringEvent, setRegisteringEvent] = useState(null);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [eventsRes, myRegsRes] = await Promise.all([
        getEvents({ status: 'Upcoming' }),
        getMyRegistrations()
      ]);

      if (eventsRes.success) setEvents(eventsRes.data);
      if (myRegsRes.success) setMyRegistrations(myRegsRes.data);
    } catch (err) {
      setError(err.message || 'Error loading dashboard data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleRegisterSubmit = async (eventId, registrationData) => {
    await registerStudent(eventId, registrationData);
    loadData();
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner" />
        <p>Loading your student dashboard...</p>
      </div>
    );
  }

  const upcomingEvents = events.filter(e => e.status === 'Upcoming');
  const availableEvents = events.filter(e => e.remaining_seats > 0);

  return (
    <div>
      {/* Welcome Banner */}
      <div className="card" style={{
        background: 'linear-gradient(135deg, #4f46e5 0%, #3730a3 100%)',
        color: 'white',
        border: 'none',
        padding: '2rem',
        marginBottom: '2rem'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <span style={{ backgroundColor: 'rgba(255,255,255,0.2)', padding: '0.25rem 0.75rem', borderRadius: 'var(--radius-full)', fontSize: '0.8rem', fontWeight: 600 }}>
              🎓 Student Portal
            </span>
            <h1 style={{ fontSize: '1.85rem', fontWeight: 800, marginTop: '0.5rem' }}>
              Welcome back, {user?.full_name || 'Student'}!
            </h1>
            <p style={{ opacity: 0.9, fontSize: '0.95rem', marginTop: '0.25rem' }}>
              {user?.course ? `${user.course} (${user.year || 'Current Year'})` : 'Campus Event Participant'}
            </p>
          </div>
          <Link to="/events" className="btn btn-secondary" style={{ backgroundColor: 'white', color: 'var(--primary)', fontWeight: 700 }}>
            🔍 Explore All Events
          </Link>
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {/* Metrics Row */}
      <div className="stats-grid">
        <StatCard 
          title="Upcoming Campus Events"
          value={upcomingEvents.length}
          description="Events scheduled this month"
          icon="📅"
          color="indigo"
        />
        <StatCard 
          title="My Registrations"
          value={myRegistrations.length}
          description="Events you are enrolled in"
          icon="📑"
          color="blue"
        />
        <StatCard 
          title="Open Seats Available"
          value={availableEvents.length}
          description="Events ready for registration"
          icon="⚡"
          color="green"
        />
      </div>

      {/* Recommended / Featured Upcoming Events */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Featured Upcoming Events</h3>
          <Link to="/events" style={{ color: 'var(--primary)', fontWeight: 600, fontSize: '0.875rem', textDecoration: 'none' }}>
            View All ({events.length}) &rarr;
          </Link>
        </div>

        {events.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📅</div>
            <h4 className="empty-title">No upcoming events right now</h4>
            <p className="empty-desc">Check back later for new college activities.</p>
          </div>
        ) : (
          <div className="events-grid">
            {events.slice(0, 4).map(event => (
              <EventCard 
                key={event.id}
                event={event}
                onRegister={setRegisteringEvent}
              />
            ))}
          </div>
        )}
      </div>

      {/* My Recent Registrations Section */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">My Recent Event Sign-ups</h3>
          <Link to="/my-registrations" style={{ color: 'var(--primary)', fontWeight: 600, fontSize: '0.875rem', textDecoration: 'none' }}>
            View Full List &rarr;
          </Link>
        </div>

        {myRegistrations.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🎓</div>
            <h4 className="empty-title">You haven't registered for any events yet</h4>
            <p className="empty-desc">Browse available campus events above and click "Register" to participate!</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Event Title</th>
                  <th>Category</th>
                  <th>Type</th>
                  <th>Event Date</th>
                  <th>Venue</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {myRegistrations.slice(0, 5).map(reg => (
                  <tr key={reg.id}>
                    <td style={{ fontWeight: 600, color: 'var(--text-navy)' }}>{reg.event_title}</td>
                    <td><span className="category-badge cat-technical">{reg.event_category}</span></td>
                    <td>
                      <span className={`status-badge ${reg.registration_type === 'Group' ? 'cat-cultural' : 'status-upcoming'}`}>
                        {reg.registration_type || 'Individual'}
                      </span>
                    </td>
                    <td style={{ color: 'var(--text-muted)' }}>
                      {new Date(reg.event_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </td>
                    <td>📍 {reg.event_venue}</td>
                    <td><span className="status-badge status-ongoing">Registered</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Registration Modal */}
      {registeringEvent && (
        <RegisterModal 
          isOpen={!!registeringEvent}
          event={registeringEvent}
          onClose={() => setRegisteringEvent(null)}
          onSubmitSuccess={handleRegisterSubmit}
        />
      )}
    </div>
  );
}
