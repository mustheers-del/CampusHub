import React from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar({ onToggleSidebar }) {
  const location = useLocation();
  const { user, isAdmin } = useAuth();

  const getTitle = () => {
    const path = location.pathname;
    if (path === '/') return isAdmin ? 'Admin Command Center' : 'Student Event Hub';
    if (path.startsWith('/events/')) return 'Event Overview & Roster';
    if (path === '/events') return isAdmin ? 'Manage Campus Events' : 'Explore Campus Events';
    if (path === '/registrations') return 'All Student Registrations';
    if (path === '/my-registrations') return 'My Registered Events';
    if (path === '/admin/students') return 'Student Directory & Management';
    if (path === '/profile') return 'Account Profile Settings';
    return 'GVMS College Portal';
  };

  return (
    <header className="navbar">
      <div className="navbar-title-section">
        <button 
          className="mobile-toggle" 
          onClick={onToggleSidebar}
          aria-label="Toggle navigation"
        >
          ☰
        </button>
        <h2 className="page-title">{getTitle()}</h2>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        {user && (
          <span className="navbar-badge">
            {isAdmin ? '🛡️ Admin Access' : `🎓 ${user.course || 'Student'}`}
          </span>
        )}
      </div>
    </header>
  );
}
