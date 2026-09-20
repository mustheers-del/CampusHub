import React, { useState, useEffect } from 'react';
import ConfirmModal from '../components/ConfirmModal';
import { getMyRegistrations, deleteRegistration } from '../services/api';

export default function MyRegistrations() {
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notification, setNotification] = useState(null);

  const [deletingId, setDeletingId] = useState(null);
  const [deletingTitle, setDeletingTitle] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  const loadRegistrations = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await getMyRegistrations();
      if (res.success) {
        setRegistrations(res.data);
      } else {
        setError(res.message || 'Failed to fetch registrations.');
      }
    } catch (err) {
      setError(err.message || 'Error connecting to server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRegistrations();
  }, []);

  const showNotification = (msg, type = 'success') => {
    setNotification({ msg, type });
    setTimeout(() => {
      setNotification(null);
    }, 3000);
  };

  const handleCancelRegistration = async () => {
    if (!deletingId) return;
    try {
      setIsDeleting(true);
      await deleteRegistration(deletingId);
      showNotification(`Successfully cancelled registration for "${deletingTitle}"!`);
      setDeletingId(null);
      loadRegistrations();
    } catch (err) {
      showNotification(err.message || 'Failed to cancel registration.', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <div className="page-header-text">
          <h1>My Registered Events</h1>
          <p>View all campus events you have signed up for.</p>
        </div>
        <div className="navbar-badge" style={{ fontSize: '0.9rem', padding: '0.4rem 0.8rem' }}>
          Total Registrations: {registrations.length}
        </div>
      </div>

      {notification && (
        <div className={`alert ${notification.type === 'error' ? 'alert-error' : 'alert-success'}`}>
          {notification.msg}
        </div>
      )}

      {loading ? (
        <div className="loading-container">
          <div className="spinner" />
          <p>Loading your event registrations...</p>
        </div>
      ) : error ? (
        <div className="alert alert-error">{error}</div>
      ) : registrations.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🎓</div>
          <h4 className="empty-title">You have no active registrations</h4>
          <p className="empty-desc">Head over to the Browse Events page to enroll in upcoming activities!</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {registrations.map(reg => (
            <div key={reg.id} className="card" style={{ marginBottom: 0 }}>
              <div className="card-header" style={{ alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                  <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.4rem' }}>
                    <span className="category-badge cat-technical">{reg.event_category}</span>
                    <span className={`status-badge ${reg.registration_type === 'Group' ? 'cat-cultural' : 'status-upcoming'}`}>
                      {reg.registration_type || 'Individual'} Registration
                    </span>
                  </div>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-navy)' }}>{reg.event_title}</h3>
                </div>

                <button 
                  className="btn btn-outline-danger btn-sm"
                  onClick={() => {
                    setDeletingId(reg.id);
                    setDeletingTitle(reg.event_title);
                  }}
                >
                  Cancel Registration
                </button>
              </div>

              <div className="form-row" style={{ marginTop: '0.5rem' }}>
                <div style={{ padding: '0.75rem 1rem', backgroundColor: 'var(--bg-page)', borderRadius: 'var(--radius-md)' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>DATE & TIME</div>
                  <div style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-navy)', marginTop: '0.1rem' }}>
                    📅 {new Date(reg.event_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} at {reg.event_time}
                  </div>
                </div>

                <div style={{ padding: '0.75rem 1rem', backgroundColor: 'var(--bg-page)', borderRadius: 'var(--radius-md)' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>VENUE</div>
                  <div style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-navy)', marginTop: '0.1rem' }}>
                    📍 {reg.event_venue}
                  </div>
                </div>
              </div>

              {/* Group details if applicable */}
              {reg.registration_type === 'Group' && (
                <div style={{ marginTop: '1rem', padding: '1rem', backgroundColor: '#f0fdf4', borderRadius: 'var(--radius-md)', border: '1px solid #bbf7d0' }}>
                  <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#166534' }}>
                    👥 Team Name: "{reg.group_name}" ({reg.group_size} Team Members)
                  </div>

                  {reg.members && reg.members.length > 0 && (
                    <div style={{ marginTop: '0.5rem', display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                      {reg.members.map(m => (
                        <div key={m.id} style={{ backgroundColor: 'white', padding: '0.35rem 0.75rem', borderRadius: 'var(--radius-sm)', fontSize: '0.8rem', border: '1px solid #cbd5e1' }}>
                          <strong>{m.member_name}</strong> ({m.member_email})
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Confirmation Modal */}
      {deletingId && (
        <ConfirmModal 
          isOpen={!!deletingId}
          title="Cancel Registration"
          message={`Are you sure you want to cancel your registration for "${deletingTitle}"?`}
          isDeleting={isDeleting}
          onConfirm={handleCancelRegistration}
          onCancel={() => setDeletingId(null)}
        />
      )}
    </div>
  );
}
