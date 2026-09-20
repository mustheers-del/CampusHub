import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import EventModal from '../components/EventModal';
import RegisterModal from '../components/RegisterModal';
import ConfirmModal from '../components/ConfirmModal';
import { 
  getEventById, 
  updateEvent, 
  deleteEvent, 
  registerStudent, 
  deleteRegistration,
  downloadEventPDF
} from '../services/api';

export default function EventDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAdmin } = useAuth();

  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notification, setNotification] = useState(null);
  const [isExportingPDF, setIsExportingPDF] = useState(false);

  // Modals state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [isDeleteEventModalOpen, setIsDeleteEventModalOpen] = useState(false);
  
  const [deletingRegId, setDeletingRegId] = useState(null);
  const [deletingStudentName, setDeletingStudentName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadEventDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await getEventById(id);
      if (res.success) {
        setEvent(res.data);
      } else {
        setError(res.message || 'Event not found.');
      }
    } catch (err) {
      setError(err.message || 'Error fetching event details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEventDetails();
  }, [id]);

  const showNotification = (msg, type = 'success') => {
    setNotification({ msg, type });
    setTimeout(() => {
      setNotification(null);
    }, 3000);
  };

  // PDF Export (Admin Only)
  const handleDownloadPDF = async () => {
    try {
      setIsExportingPDF(true);
      await downloadEventPDF(id);
      showNotification('Event PDF Report downloaded successfully!');
    } catch (err) {
      showNotification(err.message || 'Failed to generate Event PDF.', 'error');
    } finally {
      setIsExportingPDF(false);
    }
  };

  const handleEditSubmit = async (formData) => {
    await updateEvent(id, formData);
    showNotification('Event updated successfully!');
    loadEventDetails();
  };

  const handleDeleteEvent = async () => {
    try {
      setIsSubmitting(true);
      await deleteEvent(id);
      navigate('/events');
    } catch (err) {
      showNotification(err.message || 'Failed to delete event.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRegisterSubmit = async (eventId, registrationData) => {
    await registerStudent(eventId, registrationData);
    showNotification('Registration completed successfully!');
    loadEventDetails();
  };

  const handleDeleteRegistrationConfirm = async () => {
    if (!deletingRegId) return;
    try {
      setIsSubmitting(true);
      await deleteRegistration(deletingRegId);
      showNotification(`Registration for "${deletingStudentName}" removed successfully!`);
      setDeletingRegId(null);
      loadEventDetails();
    } catch (err) {
      showNotification(err.message || 'Failed to remove registration.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner" />
        <p>Loading event details...</p>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div>
        <div className="alert alert-error">{error || 'Event not found.'}</div>
        <Link to="/events" className="btn btn-primary">&larr; Back to Events</Link>
      </div>
    );
  }

  const {
    title,
    description,
    category,
    event_date,
    event_time,
    venue,
    capacity,
    registered_count = 0,
    remaining_seats = capacity,
    status = 'Upcoming',
    registration_type = 'Individual',
    registrations = []
  } = event;

  const regCount = parseInt(registered_count || 0, 10);
  const cap = parseInt(capacity || 0, 10);
  const remSeats = Math.max(0, cap - regCount);
  const isFull = remSeats <= 0;
  const percentage = cap > 0 ? Math.min(100, Math.round((regCount / cap) * 100)) : 0;

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
  };

  const formatTime = (timeStr) => {
    if (!timeStr) return '';
    const [hours, minutes] = timeStr.split(':');
    const h = parseInt(hours, 10);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const formattedHours = h % 12 || 12;
    return `${formattedHours}:${minutes} ${ampm}`;
  };

  return (
    <div>
      <div style={{ marginBottom: '1rem' }}>
        <Link to="/events" style={{ color: 'var(--text-muted)', textDecoration: 'none', fontSize: '0.9rem', fontWeight: 500 }}>
          &larr; Back to Events List
        </Link>
      </div>

      {notification && (
        <div className={`alert ${notification.type === 'error' ? 'alert-error' : 'alert-success'}`}>
          {notification.msg}
        </div>
      )}

      {/* Event Details Card */}
      <div className="card">
        <div className="card-header" style={{ alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <span className="category-badge cat-technical">{category}</span>
              <span className={`status-badge ${registration_type === 'Group' ? 'cat-cultural' : 'status-upcoming'}`}>
                {registration_type === 'Group' ? '👥 Group Event' : '👤 Individual Event'}
              </span>
              <span className="status-badge status-upcoming">{status}</span>
            </div>
            <h1 className="page-title" style={{ fontSize: '2rem' }}>{title}</h1>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <button 
              className="btn btn-primary"
              onClick={() => setIsRegisterModalOpen(true)}
              disabled={isFull}
            >
              🎓 {isFull ? 'Capacity Full' : (registration_type === 'Group' ? 'Register Team' : 'Register Student')}
            </button>

            {isAdmin && (
              <>
                <button 
                  className="btn btn-secondary"
                  onClick={handleDownloadPDF}
                  disabled={isExportingPDF}
                  title="Export official event PDF report"
                >
                  📄 {isExportingPDF ? 'Generating...' : 'Generate PDF'}
                </button>
                <button 
                  className="btn btn-secondary"
                  onClick={() => setIsEditModalOpen(true)}
                >
                  ✏️ Edit
                </button>
                <button 
                  className="btn btn-outline-danger"
                  onClick={() => setIsDeleteEventModalOpen(true)}
                >
                  🗑️ Delete
                </button>
              </>
            )}
          </div>
        </div>

        <p style={{ fontSize: '1rem', color: 'var(--text-main)', marginBottom: '1.5rem', lineHeight: '1.6' }}>
          {description || 'No description provided for this event.'}
        </p>

        <div className="form-row" style={{ marginBottom: '1.5rem' }}>
          <div style={{ padding: '1rem', backgroundColor: 'var(--bg-page)', borderRadius: 'var(--radius-md)' }}>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>DATE & TIME</div>
            <div style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-navy)', marginTop: '0.2rem' }}>
              📅 {formatDate(event_date)}
            </div>
            <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginTop: '0.1rem' }}>
              ⏰ {formatTime(event_time)}
            </div>
          </div>

          <div style={{ padding: '1rem', backgroundColor: 'var(--bg-page)', borderRadius: 'var(--radius-md)' }}>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>VENUE</div>
            <div style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-navy)', marginTop: '0.2rem' }}>
              📍 {venue}
            </div>
            <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginTop: '0.1rem' }}>
              GVMS College Campus
            </div>
          </div>
        </div>

        {/* Capacity Bar */}
        <div style={{ backgroundColor: 'var(--bg-page)', padding: '1.25rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontWeight: 600, fontSize: '0.95rem' }}>Registration Progress</span>
            <span style={{ fontWeight: 700, color: isFull ? 'var(--danger)' : 'var(--primary)' }}>
              {regCount} / {cap} Seats Filled ({percentage}%)
            </span>
          </div>
          <div className="progress-bar" style={{ height: '12px' }}>
            <div 
              className={`progress-fill ${isFull ? 'full' : ''}`}
              style={{ width: `${percentage}%` }}
            />
          </div>
          <div style={{ fontSize: '0.825rem', color: 'var(--text-muted)', marginTop: '0.5rem', display: 'flex', justifyContent: 'space-between' }}>
            <span>Total Capacity: {cap} Seats</span>
            <span>{isFull ? '🚫 Registrations Closed' : `✅ ${remSeats} seats remaining`}</span>
          </div>
        </div>
      </div>

      {/* Registered Roster Table */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Registered Students & Teams ({registrations.length})</h3>
        </div>

        {registrations.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🎓</div>
            <h4 className="empty-title">No registrations recorded yet</h4>
            <p className="empty-desc">Students can register individually or in teams for this event.</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Student / Leader</th>
                  <th>Email</th>
                  <th>Type / Group</th>
                  <th>Course</th>
                  <th>Registered Date</th>
                  {isAdmin && <th>Action</th>}
                </tr>
              </thead>
              <tbody>
                {registrations.map((reg, index) => (
                  <tr key={reg.id}>
                    <td style={{ color: 'var(--text-light)', fontWeight: 600 }}>{index + 1}</td>
                    <td style={{ fontWeight: 600 }}>{reg.student_name}</td>
                    <td>{reg.student_email}</td>
                    <td>
                      {reg.registration_type === 'Group' ? (
                        <div style={{ fontSize: '0.85rem' }}>
                          <span className="category-badge cat-cultural">👥 Team: {reg.group_name}</span>
                          <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                            ({reg.group_size} members)
                          </span>
                        </div>
                      ) : (
                        <span className="status-badge status-upcoming">👤 Individual</span>
                      )}
                    </td>
                    <td><span className="navbar-badge">{reg.student_course}</span></td>
                    <td style={{ color: 'var(--text-muted)' }}>
                      {new Date(reg.registered_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </td>
                    {isAdmin && (
                      <td>
                        <button 
                          className="btn btn-outline-danger btn-sm"
                          onClick={() => {
                            setDeletingRegId(reg.id);
                            setDeletingStudentName(reg.student_name);
                          }}
                        >
                          Remove
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {isEditModalOpen && (
        <EventModal 
          isOpen={isEditModalOpen}
          initialData={event}
          onClose={() => setIsEditModalOpen(false)}
          onSubmit={handleEditSubmit}
        />
      )}

      {/* Register Modal */}
      {isRegisterModalOpen && (
        <RegisterModal 
          isOpen={isRegisterModalOpen}
          event={event}
          onClose={() => setIsRegisterModalOpen(false)}
          onSubmitSuccess={handleRegisterSubmit}
        />
      )}

      {/* Delete Event Modal */}
      {isDeleteEventModalOpen && (
        <ConfirmModal 
          isOpen={isDeleteEventModalOpen}
          title="Delete Event"
          message={`Are you sure you want to delete "${title}"? All student registrations associated with this event will be permanently deleted.`}
          isDeleting={isSubmitting}
          onConfirm={handleDeleteEvent}
          onCancel={() => setIsDeleteEventModalOpen(false)}
        />
      )}

      {/* Delete Student Registration Modal */}
      {deletingRegId && (
        <ConfirmModal 
          isOpen={!!deletingRegId}
          title="Remove Registration"
          message={`Are you sure you want to remove the registration for "${deletingStudentName}"?`}
          isDeleting={isSubmitting}
          onConfirm={handleDeleteRegistrationConfirm}
          onCancel={() => setDeletingRegId(null)}
        />
      )}
    </div>
  );
}
