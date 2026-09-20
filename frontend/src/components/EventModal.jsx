import React, { useState, useEffect } from 'react';

const CATEGORIES = [
  'Technical',
  'Cultural',
  'Sports',
  'Workshop',
  'Seminar',
  'Competition'
];

export default function EventModal({ isOpen, onClose, onSubmit, initialData = null }) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'Technical',
    event_date: '',
    event_time: '',
    venue: '',
    capacity: 50,
    status: 'Upcoming',
    registration_type: 'Individual',
    max_group_size: 1
  });

  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (initialData) {
      let formattedDate = initialData.event_date || '';
      if (formattedDate.includes('T')) {
        formattedDate = formattedDate.split('T')[0];
      }

      setFormData({
        title: initialData.title || '',
        description: initialData.description || '',
        category: initialData.category || 'Technical',
        event_date: formattedDate,
        event_time: initialData.event_time || '',
        venue: initialData.venue || '',
        capacity: initialData.capacity || 50,
        status: initialData.status || 'Upcoming',
        registration_type: initialData.registration_type || 'Individual',
        max_group_size: initialData.max_group_size || 1
      });
    } else {
      setFormData({
        title: '',
        description: '',
        category: 'Technical',
        event_date: '',
        event_time: '',
        venue: '',
        capacity: 50,
        status: 'Upcoming',
        registration_type: 'Individual',
        max_group_size: 1
      });
    }
    setError('');
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.title.trim()) {
      setError('Event title is required.');
      return;
    }
    if (!formData.category) {
      setError('Category is required.');
      return;
    }
    if (!formData.event_date) {
      setError('Event date is required.');
      return;
    }
    if (!formData.event_time) {
      setError('Event time is required.');
      return;
    }
    if (!formData.venue.trim()) {
      setError('Venue is required.');
      return;
    }
    if (parseInt(formData.capacity, 10) <= 0 || isNaN(formData.capacity)) {
      setError('Capacity must be a positive number greater than 0.');
      return;
    }

    try {
      setIsSubmitting(true);
      await onSubmit({
        ...formData,
        max_group_size: 1 // Group size is unlimited; max_group_size is no longer restricted
      });
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to save event. Please check inputs.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">
            {initialData ? 'Edit Event' : 'Create New Event'}
          </h3>
          <button className="modal-close" onClick={onClose}>&times;</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {error && <div className="alert alert-error">{error}</div>}

            <div className="form-group">
              <label className="form-label">Event Title *</label>
              <input 
                type="text"
                name="title"
                className="form-input"
                placeholder="e.g. HackCampus 2026 Hackathon"
                value={formData.title}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Category *</label>
                <select 
                  name="category"
                  className="form-select"
                  value={formData.category}
                  onChange={handleChange}
                  required
                >
                  {CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Status</label>
                <select 
                  name="status"
                  className="form-select"
                  value={formData.status}
                  onChange={handleChange}
                >
                  <option value="Upcoming">Upcoming</option>
                  <option value="Ongoing">Ongoing</option>
                  <option value="Completed">Completed</option>
                </select>
              </div>
            </div>

            {/* Registration Type (Individual vs Group) */}
            <div className="form-group">
              <label className="form-label">Registration Type *</label>
              <select 
                name="registration_type"
                className="form-select"
                value={formData.registration_type}
                onChange={handleChange}
                required
              >
                <option value="Individual">Individual Registration</option>
                <option value="Group">Group / Team Registration (Unlimited Members)</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Description</label>
              <textarea 
                name="description"
                className="form-textarea"
                rows="3"
                placeholder="Provide a detailed description of the event..."
                value={formData.description}
                onChange={handleChange}
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Date *</label>
                <input 
                  type="date"
                  name="event_date"
                  className="form-input"
                  value={formData.event_date}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Time *</label>
                <input 
                  type="time"
                  name="event_time"
                  className="form-input"
                  value={formData.event_time}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Venue *</label>
                <input 
                  type="text"
                  name="venue"
                  className="form-input"
                  placeholder="e.g. Main Auditorium"
                  value={formData.venue}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Maximum Capacity *</label>
                <input 
                  type="number"
                  name="capacity"
                  className="form-input"
                  min="1"
                  placeholder="50"
                  value={formData.capacity}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : (initialData ? 'Update Event' : 'Create Event')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
