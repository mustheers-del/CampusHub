import React, { useState, useEffect } from 'react';
import { getStudentsAdmin } from '../services/api';

const COURSES = ['All', 'BCA 1st Year', 'BCA 2nd Year', 'BCA 3rd Year', 'B.Tech CSE', 'B.Tech ECE', 'MCA 1st Year', 'MCA 2nd Year', 'B.Sc Computer Science', 'B.Com 3rd Year'];
const YEARS = ['All', '1st Year', '2nd Year', '3rd Year', '4th Year', 'Postgraduate'];

export default function StudentManagement() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [search, setSearch] = useState('');
  const [course, setCourse] = useState('All');
  const [year, setYear] = useState('All');

  const loadStudents = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await getStudentsAdmin({ search, course, year });
      if (res.success) {
        setStudents(res.data);
      } else {
        setError(res.message || 'Failed to fetch student records.');
      }
    } catch (err) {
      setError(err.message || 'Error connecting to backend server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      loadStudents();
    }, 300);
    return () => clearTimeout(timer);
  }, [search, course, year]);

  return (
    <div>
      <div className="page-header">
        <div className="page-header-text">
          <h1>Student Directory & Management</h1>
          <p>View registered student accounts, course enrollments, and event participation stats.</p>
        </div>
        <div className="navbar-badge" style={{ fontSize: '0.9rem', padding: '0.4rem 0.8rem' }}>
          Registered Students: {students.length}
        </div>
      </div>

      {/* Filter Bar */}
      <div className="filter-bar">
        <div className="search-box">
          <span className="search-icon">🔍</span>
          <input 
            type="text"
            className="search-input"
            placeholder="Search students by name, email, or phone..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        <div className="filter-group">
          <label className="filter-label">Course:</label>
          <select 
            className="select-input"
            value={course}
            onChange={e => setCourse(e.target.value)}
          >
            {COURSES.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <label className="filter-label">Year:</label>
          <select 
            className="select-input"
            value={year}
            onChange={e => setYear(e.target.value)}
          >
            {YEARS.map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Table Card */}
      <div className="card">
        {loading ? (
          <div className="loading-container">
            <div className="spinner" />
            <p>Loading student directory...</p>
          </div>
        ) : error ? (
          <div className="alert alert-error">{error}</div>
        ) : students.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">👥</div>
            <h4 className="empty-title">No student accounts found</h4>
            <p className="empty-desc">No student accounts match the selected filters.</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Student Name</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Course</th>
                  <th>Academic Year</th>
                  <th>Event Signups</th>
                  <th>Account Created</th>
                </tr>
              </thead>
              <tbody>
                {students.map((student, idx) => (
                  <tr key={student.id}>
                    <td style={{ color: 'var(--text-light)', fontWeight: 600 }}>{idx + 1}</td>
                    <td style={{ fontWeight: 600 }}>{student.full_name}</td>
                    <td>{student.email}</td>
                    <td>{student.phone || 'N/A'}</td>
                    <td><span className="navbar-badge">{student.course}</span></td>
                    <td>{student.year || '1st Year'}</td>
                    <td>
                      <span className={`status-badge ${student.registration_count > 0 ? 'status-upcoming' : 'status-completed'}`}>
                        {student.registration_count} {student.registration_count === 1 ? 'Event' : 'Events'}
                      </span>
                    </td>
                    <td style={{ color: 'var(--text-muted)' }}>
                      {new Date(student.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
