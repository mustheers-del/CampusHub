mport React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getProfile, updateProfile } from '../services/api';

const COURSES = [
  'BCA 1st Year',
  'BCA 2nd Year',
  'BCA 3rd Year',
  'B.Tech CSE',
  'B.Tech ECE',
  'MCA 1st Year',
  'MCA 2nd Year',
  'B.Sc Computer Science',
  'B.Com 3rd Year',
  'MBA'
];

const YEARS = ['1st Year', '2nd Year', '3rd Year', '4th Year', 'Postgraduate'];

export default function StudentProfile() {
  const { user, isAdmin, updateUser } = useAuth();

  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
    course: 'BCA 3rd Year',
    year: '3rd Year'
  });

  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notification, setNotification] = useState(null);

  useEffect(() => {
    async function loadProfile() {
      try {
        setLoading(true);
        const res = await getProfile();
        if (res.success && res.user) {
          setFormData({
            full_name: res.user.full_name || '',
            phone: res.user.phone || '',
            course: res.user.course || 'BCA 3rd Year',
            year: res.user.year || '3rd Year'
          });
        }
      } catch (err) {
        console.error('Failed to load profile:', err);
      } finally {
        setLoading(false);
      }
    }
    loadProfile();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const showNotification = (msg, type = 'success') => {
    setNotification({ msg, type });
    setTimeout(() => {
      setNotification(null);
    }, 3000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.full_name.trim()) {
      showNotification('Full Name is required.', 'error');
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await updateProfile(formData);
      if (res.success) {
        updateUser(res.user);
        showNotification('Profile updated successfully!');
      } else {
        showNotification(res.message || 'Failed to update profile.', 'error');
      }
    } catch (err) {
      showNotification(err.message || 'Error updating profile.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner" />
        <p>Loading account profile...</p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '680px' }}>
      <div className="page-header">
        <div className="page-header-text">
          <h1>Account Profile Settings</h1>
          <p>View and manage your personal account information.</p>
        </div>
      </div>

      {notification && (
        <div className={alert ${notification.type === 'error' ? 'alert-error' : 'alert-success'}}>
          {notification.msg}
        </div>
      )}

      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem', paddingBottom: '1.25rem', borderBottom: '1px solid var(--border-color)' }}>
          <div className="brand-icon" style={{ width: '60px', height: '60px', fontSize: '1.5rem' }}>
            {isAdmin ? '🛡️' : '👤'}
          </div>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-navy)' }}>
              {user?.full_name || 'Account User'}
            </h2>
            <p style={{ fontSize: '0.875rem', color: 'var(--primary)', fontWeight: 600 }}>
              {isAdmin ? 'System Administrator' : ${user?.course} (${user?.year || 'Student'})}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Email Address (Login Identifier)</label>
            <input 
              type="email"
              className="form-input"
              value={user?.email || ''}
              disabled
              style={{ backgroundColor: 'var(--bg-page)', cursor: 'not-allowed', color: 'var(--text-muted)' }}
            />
            <span style={{ fontSize: '0.75rem', color: 'var(--text-light)', marginTop: '0.25rem', display: 'block' }}>
              Email address cannot be changed directly as it acts as your unique login key.
            </span>
          </div>

          <div className="form-group">
            <label className="form-label">Full Name *</label>
            <input 
              type="text"
              name="full_name"
              className="form-input"
              value={formData.full_name}
              onChange={handleChange}
              disabled={isAdmin}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Phone Number</label>
            <input 
              type="tel"
              name="phone"
              className="form-input"
              placeholder="e.g. 9876543210"
              value={formData.phone}
              onChange={handleChange}
              disabled={isAdmin}
            />
          </div>

          {!isAdmin && (
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Course / Program *</label>
                <select 
                  name="course"
                  className="form-select"
                  value={formData.course}
                  onChange={handleChange}
                  required
                >
                  {COURSES.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Academic Year *</label>
                <select 
                  name="year"
                  className="form-select"
                  value={formData.year}
                  onChange={handleChange}
                  required
                >
                  {YEARS.map(y => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {!isAdmin && (
            <button 
              type="submit" 
              className="btn btn-primary" 
              style={{ marginTop: '0.5rem' }}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Saving Changes...' : 'Save Profile Changes'}
            </button>
          )}
        </form>
      </div>
    </div>
  );
}