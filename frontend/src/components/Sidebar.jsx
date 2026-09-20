import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Sidebar({ isOpen, onClose }) {
  const { user, isAdmin, isStudent, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    onClose();
    navigate('/login');
  };

  return (
    <>
      {isOpen && (
        <div 
          className="modal-overlay" 
          style={{ zIndex: 35, background: 'rgba(15,23,42,0.4)' }}
          onClick={onClose}
        />
      )}

      <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
        <div className="sidebar-brand">
          <div className="brand-icon">GV</div>
          <div>
            <h1 className="brand-title">GVMS</h1>
            <p className="brand-subtitle">College Portal</p>
          </div>
        </div>

        {user && (
          <div style={{ padding: '0.85rem 1rem', margin: '0.75rem 1rem 0 1rem', backgroundColor: 'var(--bg-page)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
            <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-navy)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {user.full_name}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--primary)', fontWeight: 600, textTransform: 'uppercase', marginTop: '0.1rem' }}>
              {isAdmin ? '🛡️ Administrator' : '🎓 Student Account'}
            </div>
          </div>
        )}

        <nav className="sidebar-nav">
          <NavLink 
            to="/" 
            end
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            onClick={onClose}
          >
            <span className="nav-icon">📊</span>
            <span>Dashboard</span>
          </NavLink>

          <NavLink 
            to="/events" 
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            onClick={onClose}
          >
            <span className="nav-icon">📅</span>
            <span>{isAdmin ? 'Manage Events' : 'Browse Events'}</span>
          </NavLink>

          {isAdmin ? (
            <>
              <NavLink 
                to="/registrations" 
                className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                onClick={onClose}
              >
                <span className="nav-icon">🎓</span>
                <span>All Registrations</span>
              </NavLink>

              <NavLink 
                to="/admin/students" 
                className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                onClick={onClose}
              >
                <span className="nav-icon">👥</span>
                <span>Student Management</span>
              </NavLink>
            </>
          ) : (
            <NavLink 
              to="/my-registrations" 
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
              onClick={onClose}
            >
              <span className="nav-icon">📑</span>
              <span>My Registrations</span>
            </NavLink>
          )}

          <NavLink 
            to="/profile" 
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            onClick={onClose}
          >
            <span className="nav-icon">👤</span>
            <span>{isAdmin ? 'System Profile' : 'My Profile'}</span>
          </NavLink>
        </nav>

        <div className="sidebar-footer">
          <button 
            className="btn btn-secondary btn-sm" 
            style={{ width: '100%', justifyContent: 'center' }}
            onClick={handleLogout}
          >
            🚪 Sign Out
          </button>
        </div>
      </aside>
    </>
  );
}
