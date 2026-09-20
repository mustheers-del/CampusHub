import React, { useState, useEffect } from 'react';
import ConfirmModal from '../components/ConfirmModal';
import { getAllRegistrations, deleteRegistration } from '../services/api';

export default function Registrations() {
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [notification, setNotification] = useState(null);

  // Delete modal state
  const [deletingId, setDeletingId] = useState(null);
  const [deletingName, setDeletingName] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  const loadRegistrations = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await getAllRegistrations();
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

  const handleDeleteConfirm = async () => {
    if (!deletingId) return;
    try {
      setIsDeleting(true);
      await deleteRegistration(deletingId);
      showNotification(`Registration for "${deletingName}" deleted successfully!`);
      setDeletingId(null);
      loadRegistrations();
    } catch (err) {
      showNotification(err.message || 'Failed to delete registration.', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  // Filter registrations based on search term
  const filteredRegistrations = registrations.filter(reg => {
    const term = search.toLowerCase();
    return (
      (reg.student_name || '').toLowerCase().includes(term) ||
      (reg.student_email || '').toLowerCase().includes(term) ||
      (reg.student_course || '').toLowerCase().includes(term) ||
      (reg.event_title || '').toLowerCase().includes(term)
    );
  });

  return (
    <div>
      <div className="page-header">
        <div className="page-header-text">
          <h1>Student Registrations</h1>
          <p>View and manage all registered students for college events.</p>
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

      {/* Filter / Search Bar */}
      <div className="filter-bar">
        <div className="search-box">
          <span className="search-icon">🔍</span>
          <input 
            type="text"
            className="search-input"
            placeholder="Search by student name, email, course, or event title..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Registrations Table Card */}
      <div className="card">
        {loading ? (
          <div className="loading-container">
            <div className="spinner" />
            <p>Loading student registrations...</p>
          </div>
        ) : error ? (
          <div className="alert alert-error">{error}</div>
        ) : filteredRegistrations.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🎓</div>
            <h4 className="empty-title">No student registrations found</h4>
            <p className="empty-desc">
              {search ? 'Try clearing your search query.' : 'Register students for events from the Events page.'}
            </p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Student Name</th>
                  <th>Email</th>
                  <th>Course</th>
                  <th>Event Registered</th>
                  <th>Registration Date</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredRegistrations.map((reg, idx) => (
                  <tr key={reg.id}>
                    <td style={{ color: 'var(--text-light)', fontWeight: 600 }}>{idx + 1}</td>
                    <td style={{ fontWeight: 600 }}>{reg.student_name}</td>
                    <td>{reg.student_email}</td>
                    <td><span className="navbar-badge">{reg.student_course}</span></td>
                    <td style={{ color: 'var(--primary)', fontWeight: 600 }}>{reg.event_title}</td>
                    <td style={{ color: 'var(--text-muted)' }}>
                      {new Date(reg.registered_at).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </td>
                    <td>
                      <button 
                        className="btn btn-outline-danger btn-sm"
                        onClick={() => {
                          setDeletingId(reg.id);
                          setDeletingName(reg.student_name);
                        }}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deletingId && (
        <ConfirmModal 
          isOpen={!!deletingId}
          title="Delete Registration"
          message={`Are you sure you want to delete the registration for student "${deletingName}"?`}
          isDeleting={isDeleting}
          onConfirm={handleDeleteConfirm}
          onCancel={() => setDeletingId(null)}
        />
      )}
    </div>
  );
}
