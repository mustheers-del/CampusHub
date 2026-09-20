import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

const COMMON_COURSES = [
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

export default function RegisterModal({ isOpen, onClose, event, onSubmitSuccess }) {
  const { user } = useAuth();

  // Individual Form Fields
  const [studentName, setStudentName] = useState('');
  const [studentEmail, setStudentEmail] = useState('');
  const [studentCourse, setStudentCourse] = useState('BCA 3rd Year');

  // Group Form Fields
  const [groupName, setGroupName] = useState('');
  const [members, setMembers] = useState([]);

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isGroup = event && event.registration_type === 'Group';

  useEffect(() => {
    if (user) {
      setStudentName(user.full_name || '');
      setStudentEmail(user.email || '');
      setStudentCourse(user.course || 'BCA 3rd Year');
    } else {
      setStudentName('');
      setStudentEmail('');
      setStudentCourse('BCA 3rd Year');
    }

    if (isGroup) {
      setGroupName('');
      setMembers([
        {
          member_name: user ? `${user.full_name} (Leader)` : '',
          member_email: user ? user.email : '',
          member_phone: user ? (user.phone || '') : '',
          member_course: user ? (user.course || 'BCA 3rd Year') : 'BCA 3rd Year'
        },
        { member_name: '', member_email: '', member_phone: '', member_course: 'BCA 3rd Year' }
      ]);
    }

    setError('');
    setSuccess('');
  }, [event, isOpen, user]);

  if (!isOpen || !event) return null;

  const handleMemberChange = (index, field, value) => {
    setMembers(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  // Unlimited Member Addition
  const addMemberRow = () => {
    setMembers(prev => [
      ...prev,
      { member_name: '', member_email: '', member_phone: '', member_course: 'BCA 3rd Year' }
    ]);
  };

  const removeMemberRow = (index) => {
    if (members.length <= 1) {
      setError('A group registration must contain at least 1 member.');
      return;
    }
    setMembers(prev => prev.filter((_, idx) => idx !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!isGroup) {
      // Individual Validation
      if (!studentName.trim()) {
        setError('Please enter student full name.');
        return;
      }
      if (!studentEmail.trim()) {
        setError('Please enter student email address.');
        return;
      }
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(studentEmail.trim())) {
        setError('Please enter a valid email address.');
        return;
      }

      try {
        setIsSubmitting(true);
        await onSubmitSuccess(event.id, {
          registration_type: 'Individual',
          student_name: studentName.trim(),
          student_email: studentEmail.trim(),
          student_course: studentCourse
        });

        setSuccess(`Successfully registered ${studentName} for "${event.title}"!`);
        setTimeout(() => {
          setSuccess('');
          onClose();
        }, 1500);
      } catch (err) {
        setError(err.message || 'Registration failed. Please check inputs.');
      } finally {
        setIsSubmitting(false);
      }

    } else {
      // Group Validation (UNLIMITED MEMBERS SUPPORTED)
      if (!groupName.trim()) {
        setError('Please enter a Team / Group Name.');
        return;
      }

      const validMembers = members.filter(m => m.member_name.trim() && m.member_email.trim());
      if (validMembers.length === 0) {
        setError('Please fill in details for at least one team member.');
        return;
      }

      try {
        setIsSubmitting(true);
        await onSubmitSuccess(event.id, {
          registration_type: 'Group',
          group_name: groupName.trim(),
          student_name: validMembers[0].member_name.trim(),
          student_email: validMembers[0].member_email.trim(),
          student_course: validMembers[0].member_course,
          members: validMembers
        });

        setSuccess(`Group "${groupName}" (${validMembers.length} members) successfully registered for "${event.title}"!`);
        setTimeout(() => {
          setSuccess('');
          onClose();
        }, 1500);
      } catch (err) {
        setError(err.message || 'Group registration failed. Please check inputs.');
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const regCount = parseInt(event.registered_count || 0, 10);
  const cap = parseInt(event.capacity || 0, 10);
  const remSeats = Math.max(0, cap - regCount);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" style={{ maxWidth: isGroup ? '680px' : '520px' }} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">
            {isGroup ? 'Group / Team Registration' : 'Student Event Registration'}
          </h3>
          <button className="modal-close" onClick={onClose}>&times;</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div style={{ backgroundColor: 'var(--bg-page)', padding: '1rem', borderRadius: 'var(--radius-md)', marginBottom: '1.25rem', border: '1px solid var(--border-color)' }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Target Event</div>
              <div style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-navy)', marginTop: '0.2rem' }}>{event.title}</div>
              <div style={{ fontSize: '0.85rem', color: 'var(--primary)', marginTop: '0.2rem', fontWeight: 600 }}>
                Type: {event.registration_type || 'Individual'} | {regCount} registered · {remSeats} seats remaining
              </div>
            </div>

            {error && <div className="alert alert-error">{error}</div>}
            {success && <div className="alert alert-success">{success}</div>}

            {!isGroup ? (
              /* Individual Form */
              <>
                <div className="form-group">
                  <label className="form-label">Student Full Name *</label>
                  <input 
                    type="text"
                    className="form-input"
                    placeholder="e.g. Aarav Sharma"
                    value={studentName}
                    onChange={e => setStudentName(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Student Email *</label>
                  <input 
                    type="email"
                    className="form-input"
                    placeholder="e.g. aarav.sharma@example.com"
                    value={studentEmail}
                    onChange={e => setStudentEmail(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Course / Branch *</label>
                  <select 
                    className="form-select"
                    value={studentCourse}
                    onChange={e => setStudentCourse(e.target.value)}
                  >
                    {COMMON_COURSES.map(course => (
                      <option key={course} value={course}>{course}</option>
                    ))}
                  </select>
                </div>
              </>
            ) : (
              /* Group Form - Unlimited Members */
              <>
                <div className="form-group">
                  <label className="form-label">Team / Group Name *</label>
                  <input 
                    type="text"
                    className="form-input"
                    placeholder="e.g. Code Ninjas"
                    value={groupName}
                    onChange={e => setGroupName(e.target.value)}
                    required
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '1.25rem 0 0.75rem 0' }}>
                  <label className="form-label" style={{ margin: 0 }}>Team Members ({members.length} Members Added)</label>
                  <button type="button" className="btn btn-secondary btn-sm" onClick={addMemberRow}>
                    ➕ Add Member
                  </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', maxHeight: '360px', overflowY: 'auto', paddingRight: '0.25rem' }}>
                  {members.map((m, idx) => (
                    <div key={idx} style={{ padding: '0.9rem', backgroundColor: 'var(--bg-page)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                        <span style={{ fontSize: '0.825rem', fontWeight: 700, color: 'var(--primary)' }}>
                          {idx === 0 ? '👑 Team Leader' : `Member #${idx + 1}`}
                        </span>
                        {idx > 0 && (
                          <button type="button" onClick={() => removeMemberRow(idx)} style={{ background: 'none', border: 'none', color: 'var(--danger)', fontSize: '0.8rem', cursor: 'pointer', fontWeight: 600 }}>
                            🗑️ Remove
                          </button>
                        )}
                      </div>

                      <div className="form-row" style={{ marginBottom: '0.5rem' }}>
                        <div>
                          <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>Full Name *</label>
                          <input 
                            type="text"
                            className="form-input"
                            placeholder="Full Name"
                            value={m.member_name}
                            onChange={e => handleMemberChange(idx, 'member_name', e.target.value)}
                            required
                          />
                        </div>

                        <div>
                          <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>Email Address *</label>
                          <input 
                            type="email"
                            className="form-input"
                            placeholder="Email Address"
                            value={m.member_email}
                            onChange={e => handleMemberChange(idx, 'member_email', e.target.value)}
                            required
                          />
                        </div>
                      </div>

                      <div className="form-row">
                        <div>
                          <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>Phone Number</label>
                          <input 
                            type="tel"
                            className="form-input"
                            placeholder="Phone Number"
                            value={m.member_phone}
                            onChange={e => handleMemberChange(idx, 'member_phone', e.target.value)}
                          />
                        </div>

                        <div>
                          <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>Course</label>
                          <select 
                            className="form-select"
                            value={m.member_course}
                            onChange={e => handleMemberChange(idx, 'member_course', e.target.value)}
                          >
                            {COMMON_COURSES.map(course => (
                              <option key={course} value={course}>{course}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div style={{ marginTop: '0.75rem', textAlign: 'center' }}>
                  <button type="button" className="btn btn-secondary btn-sm" onClick={addMemberRow} style={{ width: '100%', borderStyle: 'dashed' }}>
                    ➕ Add Another Member
                  </button>
                </div>
              </>
            )}
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button 
              type="submit" 
              className="btn btn-primary" 
              disabled={isSubmitting || remSeats <= 0}
            >
              {isSubmitting ? 'Registering...' : (isGroup ? `Register Team (${members.length} Members)` : 'Confirm Registration')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
