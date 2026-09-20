import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function EventCard({ event, onRegister, onEdit, onDelete }) {
  const { isAdmin } = useAuth();

  const {
    id,
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
    registration_type = 'Individual'
  } = event;

  const regCount = parseInt(registered_count || 0, 10);
  const cap = parseInt(capacity || 0, 10);
  const remSeats = Math.max(0, cap - regCount);
  const isFull = remSeats <= 0;
  const percentage = cap > 0 ? Math.min(100, Math.round((regCount / cap) * 100)) : 0;

  const getCategoryClass = (cat) => {
    switch ((cat || '').toLowerCase()) {
      case 'technical': return 'cat-technical';
      case 'cultural': return 'cat-cultural';
      case 'sports': return 'cat-sports';
      case 'workshop': return 'cat-workshop';
      case 'seminar': return 'cat-seminar';
      case 'competition': return 'cat-competition';
      default: return 'cat-default';
    }
  };

  const getStatusClass = (st) => {
    switch ((st || '').toLowerCase()) {
      case 'upcoming': return 'status-upcoming';
      case 'ongoing': return 'status-ongoing';
      case 'completed': return 'status-completed';
      default: return 'status-upcoming';
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
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
    <div className="event-card">
      <div>
        <div className="event-card-header">
          <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
            <span className={`category-badge ${getCategoryClass(category)}`}>
              {category}
            </span>
            <span className={`status-badge ${registration_type === 'Group' ? 'cat-cultural' : 'status-upcoming'}`}>
              {registration_type === 'Group' ? '👥 Group' : '👤 Individual'}
            </span>
          </div>
          <span className={`status-badge ${getStatusClass(status)}`}>
            {status}
          </span>
        </div>

        <h3 className="event-title">{title}</h3>
        {description && <p className="event-description">{description}</p>}

        <div className="event-meta">
          <div className="meta-item">
            <span>📅</span>
            <span>{formatDate(event_date)} at {formatTime(event_time)}</span>
          </div>
          <div className="meta-item">
            <span>📍</span>
            <span>{venue}</span>
          </div>
        </div>

        <div className="progress-container">
          <div className="progress-labels">
            <span>{regCount} registered</span>
            <span style={{ color: isFull ? 'var(--danger)' : 'var(--text-muted)' }}>
              {isFull ? 'Full capacity' : `${remSeats} seats remaining`}
            </span>
          </div>
          <div className="progress-bar">
            <div 
              className={`progress-fill ${isFull ? 'full' : ''}`}
              style={{ width: `${percentage}%` }}
            />
          </div>
        </div>
      </div>

      <div className="event-card-actions">
        <Link to={`/events/${id}`} className="btn btn-secondary btn-sm" style={{ flex: 1 }}>
          View Details
        </Link>
        
        {onRegister && (
          <button 
            className="btn btn-primary btn-sm"
            onClick={() => onRegister(event)}
            disabled={isFull}
            title={isFull ? 'Event is full' : 'Register for event'}
          >
            {isFull ? 'Full' : (registration_type === 'Group' ? 'Register Team' : 'Register')}
          </button>
        )}

        {isAdmin && onEdit && (
          <button 
            className="btn btn-secondary btn-sm"
            onClick={() => onEdit(event)}
            title="Edit event"
          >
            ✏️
          </button>
        )}

        {isAdmin && onDelete && (
          <button 
            className="btn btn-outline-danger btn-sm"
            onClick={() => onDelete(id, title)}
            title="Delete event"
          >
            🗑️
          </button>
        )}
      </div>
    </div>
  );
}
