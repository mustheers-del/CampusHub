
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import EventCard from '../components/EventCard';
import EventModal from '../components/EventModal';
import RegisterModal from '../components/RegisterModal';
import ConfirmModal from '../components/ConfirmModal';
import {
  getEvents,
  createEvent,
  updateEvent,
  deleteEvent,
  registerStudent
} from '../services/api';

const CATEGORIES = [
  'All',
  'Technical',
  'Cultural',
  'Sports',
  'Workshop',
  'Seminar',
  'Competition'
];

const STATUSES = [
  'All',
  'Upcoming',
  'Ongoing',
  'Completed'
];

const REG_TYPES = [
  'All',
  'Individual',
  'Group'
];

export default function Events() {
  const { isAdmin } = useAuth();

  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notification, setNotification] = useState(null);

  // Filters state
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [status, setStatus] = useState('All');
  const [regType, setRegType] = useState('All');

  // Modal states
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);

  const [registeringEvent, setRegisteringEvent] = useState(null);

  const [deletingEventId, setDeletingEventId] = useState(null);
  const [deletingEventTitle, setDeletingEventTitle] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  const loadEvents = async () => {
    try {
      setLoading(true);
      setError(null);

      const res = await getEvents({
        search,
        category,
        status,
        registration_type: regType
      });

      if (res.success) {
        setEvents(res.data);
      } else {
        setError(res.message || 'Failed to fetch events.');
      }
    } catch (err) {
      setError(
        err.message || 'Error connecting to backend server.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      loadEvents();
    }, 300);

    return () => clearTimeout(timer);
  }, [search, category, status, regType]);

  const showNotification = (msg, type = 'success') => {
    setNotification({
      msg,
      type
    });

    setTimeout(() => {
      setNotification(null);
    }, 3000);
  };

  const handleSaveEvent = async (formData) => {
    if (editingEvent) {
      await updateEvent(editingEvent.id, formData);

      showNotification(
        `Event "${formData.title}" updated successfully!`
      );
    } else {
      await createEvent(formData);

      showNotification(
        `Event "${formData.title}" created successfully!`
      );
    }

    loadEvents();
  };

  const handleDeleteConfirm = async () => {
    if (!deletingEventId) return;

    try {
      setIsDeleting(true);

      await deleteEvent(deletingEventId);

      showNotification(
        `Event "${deletingEventTitle}" deleted successfully!`
      );

      setDeletingEventId(null);
      loadEvents();
    } catch (err) {
      showNotification(
        err.message || 'Failed to delete event',
        'error'
      );
    } finally {
      setIsDeleting(false);
    }
  };

  const handleRegisterStudent = async (
    eventId,
    registrationData
  ) => {
    await registerStudent(eventId, registrationData);

    showNotification(
      'Registration completed successfully!'
    );

    loadEvents();
  };

  return (
    <div>
      <div className="page-header">
        <div className="page-header-text">
          <h1>
            {isAdmin
              ? 'Campus Events Management'
              : 'Explore Campus Events'}
          </h1>

          <p>
            Browse, search, filter, and register for upcoming
            college activities and group challenges.
          </p>
        </div>

        {isAdmin && (
          <button
            className="btn btn-primary"
            onClick={() => {
              setEditingEvent(null);
              setIsEventModalOpen(true);
            }}
          >
            ➕ Create New Event
          </button>
        )}
      </div>

      {notification && (
        <div
          className={`alert ${
            notification.type === 'error'
              ? 'alert-error'
              : 'alert-success'
          }`}
        >
          {notification.msg}
        </div>
      )}

      {/* Filter Bar */}
      <div className="filter-bar">
        <div className="search-box">
          <span className="search-icon">🔍</span>

          <input
            type="text"
            className="search-input"
            placeholder="Search events by title, description or venue..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="filter-group">
          <label className="filter-label">
            Category:
          </label>

          <select
            className="select-input"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <label className="filter-label">
            Type:
          </label>

          <select
            className="select-input"
            value={regType}
            onChange={(e) => setRegType(e.target.value)}
          >
            {REG_TYPES.map((rt) => (
              <option key={rt} value={rt}>
                {rt === 'All' ? 'All Types' : rt}
              </option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <label className="filter-label">
            Status:
          </label>

          <select
            className="select-input"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            {STATUSES.map((st) => (
              <option key={st} value={st}>
                {st}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Events Grid */}
      {loading ? (
        <div className="loading-container">
          <div className="spinner" />
          <p>Loading events...</p>
        </div>
      ) : error ? (
        <div className="alert alert-error">
          {error}
        </div>
      ) : events.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🔍</div>

          <h4 className="empty-title">
            No matching events found
          </h4>

          <p className="empty-desc">
            Try adjusting your filters or search query.
          </p>
        </div>
      ) : (
        <div className="events-grid">
          {events.map((event) => (
            <EventCard
              key={event.id}
              event={event}
              onRegister={setRegisteringEvent}
              onEdit={
                isAdmin
                  ? (ev) => {
                      setEditingEvent(ev);
                      setIsEventModalOpen(true);
                    }
                  : null
              }
              onDelete={
                isAdmin
                  ? (id, title) => {
                      setDeletingEventId(id);
                      setDeletingEventTitle(title);
                    }
                  : null
              }
            />
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      {isAdmin && isEventModalOpen && (
        <EventModal
          isOpen={isEventModalOpen}
          initialData={editingEvent}
          onClose={() => {
            setIsEventModalOpen(false);
            setEditingEvent(null);
          }}
          onSubmit={handleSaveEvent}
        />
      )}

      {/* Register Modal */}
      {registeringEvent && (
        <RegisterModal
          isOpen={!!registeringEvent}
          event={registeringEvent}
          onClose={() => setRegisteringEvent(null)}
          onSubmitSuccess={handleRegisterStudent}
        />
      )}

      {/* Delete Confirmation Modal */}
      {isAdmin && deletingEventId && (
        <ConfirmModal
          isOpen={!!deletingEventId}
          title="Delete College Event"
          message={`Are you sure you want to delete "${deletingEventTitle}"? All student registrations for this event will also be deleted.`}
          isDeleting={isDeleting}
          onConfirm={handleDeleteConfirm}
          onCancel={() => setDeletingEventId(null)}
        />
      )}
    </div>
  );
}
