import React, { useState } from 'react';
import { format } from 'date-fns';
import { eventsAPI } from '../services/apiServices';
import { useAuth } from '../Context/AuthContext';

const EventForm = ({ selectedDate, onClose, onEventCreated }) => {
  const { user } = useAuth();
  const userId=user.id;
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    eventDateTime: format(selectedDate, 'yyyy-MM-dd') + 'T10:00',
    endDateTime: format(selectedDate, 'yyyy-MM-dd') + 'T11:00',
    location: '',
    category: 'Meeting',
    isOpenEvent: false,
    organizer: userId || ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Validate required fields
      if (!formData.title || formData.title.length < 5 || formData.title.length > 100) {
        throw new Error('Title must be between 5 and 100 characters');
      }
      if (!formData.description || formData.description.length > 500) {
        throw new Error('Description is required and must not exceed 500 characters');
      }
      if (!formData.location || formData.location.length > 100) {
        throw new Error('Location is required and must not exceed 100 characters');
      }
      if (!formData.organizer || formData.organizer.length > 50) {
        throw new Error('Organizer ID is required and must not exceed 50 characters');
      }

      const response = await eventsAPI.createEvent(formData);
      if (response.data) {
        onEventCreated(response.data);
        onClose();
      } else {
        console.error('Failed to create event');
      }
    } catch (error) {
      console.error('Error:', error.message || error);
      alert(error.message || 'Failed to create event. Please check your input.');
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prevData => ({
      ...prevData,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  return (
    <div className="event-form">
      <div className="form-header">
        <h3>Create New Event</h3>
        <button onClick={onClose} className="close-btn">×</button>
      </div>
      
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Title</label>
          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleChange}
            required
          />
        </div>
        
        <div className="form-group">
          <label>Description</label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
          />
        </div>
        
        <div className="form-row">
          <div className="form-group">
            <label>Start</label>
            <input
              type="datetime-local"
              name="eventDateTime"
              value={formData.eventDateTime}
              onChange={handleChange}
              required
            />
          </div>
          
          <div className="form-group">
            <label>End</label>
            <input
              type="datetime-local"
              name="endDateTime"
              value={formData.endDateTime}
              onChange={handleChange}
              required
            />
          </div>
        </div>
        
        <div className="form-group">
          <label>Location</label>
          <input
            type="text"
            name="location"
            value={formData.location}
            onChange={handleChange}
          />
        </div>
        
        <div className="form-group">
          <label>Category</label>
          <select
            name="category"
            value={formData.category}
            onChange={handleChange}
          >
            <option value="Meeting">Meeting</option>
            <option value="Training">Training</option>
            <option value="Social">Social Event</option>
            <option value="Deadline">Deadline</option>
          </select>
        </div>
        
        <div className="form-group checkbox-group">
          <input
            type="checkbox"
            name="isOpenEvent"
            id="isOpenEvent"
            checked={formData.isOpenEvent}
            onChange={handleChange}
          />
          <label htmlFor="isOpenEvent">Open Event (no RSVP needed)</label>
        </div>
        
        <div className="form-actions">
          <button type="button" onClick={onClose}>Cancel</button>
          <button type="submit">Create Event</button>
        </div>
      </form>
    </div>
  );
};

export default EventForm;