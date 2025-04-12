import React, { useState, useEffect } from 'react';
import { format, formatDistanceToNow } from 'date-fns';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faCalendarAlt, 
  faClock, 
  faMapMarkerAlt, 
  faUsers,
  faFileAlt,
  faTrashAlt,
  faEdit,
  faSave,
  faTimes,
  faBirthdayCake
} from '@fortawesome/free-solid-svg-icons';
import { faGoogle } from '@fortawesome/free-brands-svg-icons';
import { eventsAPI } from '../services/apiServices';
import toast from 'react-hot-toast';
import { useAuth } from '../Context/AuthContext';
import AttendeeManagement from './AttendeeManagement';
import UserBadge from './UserBadge';
const EventDetails = ({ event, onClose, onDelete, onUpdate }) => {
  const [birthdays, setBirthdays] = useState([]);

  useEffect(() => {
    const fetchBirthdays = async () => {
      try {
        const response = await eventsAPI.getBirthdayEvents();
        setBirthdays(response.data);
      } catch (error) {
        console.error('Error fetching birthdays:', error);
      }
    };
    
    fetchBirthdays();
  }, []);
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [editedEvent, setEditedEvent] = useState({ ...event });
  const [isDeleting, setIsDeleting] = useState(false);
  const [isRemovingAttendee, setIsRemovingAttendee] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  const startDate = new Date(editedEvent.eventDateTime);
  const endDate = editedEvent.endDateTime ? new Date(editedEvent.endDateTime) : new Date(startDate.getTime() + 60 * 60 * 1000);

  const addToGoogleCalendar = () => {
    const startISO = startDate.toISOString().replace(/-|:|\.\d\d\d/g, '');
    const endISO = endDate.toISOString().replace(/-|:|\.\d\d\d/g, '');
    
    const googleCalendarUrl = `https://www.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(editedEvent.title)}&dates=${startISO}/${endISO}&details=${encodeURIComponent(editedEvent.description)}&location=${encodeURIComponent(editedEvent.location)}`;
    
    window.open(googleCalendarUrl, '_blank');
    toast.success('Opened Google Calendar');
  };

  const handleAttendeeAction = async (action, attendeeId) => {
    try {
      setIsRemovingAttendee(attendeeId);
      if (action === 'remove') {
        await eventsAPI.removeAttendee(editedEvent.id, attendeeId);
        toast.success('Attendee removed successfully');
        if (typeof onUpdate === 'function') {
          onUpdate(); 
        }
      }
    } catch (error) {
      console.error(`Failed to ${action} attendee:`, error);
      toast.error(`Failed to ${action} attendee`);
    } finally {
      setIsRemovingAttendee(null);
    }
  };

  const handleDeleteEvent = async () => {
    try {
      setIsDeleting(true);
      await eventsAPI.deleteEvent(editedEvent.id);
      toast.success('Event deleted successfully');
      onDelete();
    } catch (error) {
      console.error('Failed to delete event:', error);
      toast.error('Failed to delete event');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleEditToggle = () => {
    setIsEditing(!isEditing);
    if (isEditing) {
      // Reset to original values if canceling edit
      setEditedEvent({ ...event });
    }
  };

  const handleFieldChange = (e) => {
    const { name, value, type, checked } = e.target;
    setEditedEvent(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSaveChanges = async () => {
    try {
      setIsSaving(true);
      // Basic validation
      if (!editedEvent.title || editedEvent.title.length < 5) {
        throw new Error('Title must be at least 5 characters');
      }
      

      await eventsAPI.updateEvent(editedEvent.id, {
        title: editedEvent.title,
        description: editedEvent.description,
        eventDateTime: editedEvent.eventDateTime,
        endDateTime: editedEvent.endDateTime,
        location: editedEvent.location,
        category: editedEvent.category,
        isOpenEvent: editedEvent.isOpenEvent
      });

      toast.success('Event updated successfully');
      setIsEditing(false);
      
    } catch (error) {
      console.error('Failed to update event:', error);
      toast.error(error.message || 'Failed to update event');
    } finally {
      setIsSaving(false);
    }
  };

  const isOrganizer = user.id === editedEvent.organizer;

  return (
    <div className="event-details">
      <div className="event-header">
        <h2>
          {isEditing ? (
            <input
              type="text"
              name="title"
              value={editedEvent.title}
              onChange={handleFieldChange}
              className="edit-title-input"
            />
          ) : (
            editedEvent.title
          )}
        </h2>
        <button onClick={onClose} className="close-btn">×</button>
      </div>
      
      <div className="event-category-badge">
        {isEditing ? (
          <select
            name="category"
            value={editedEvent.category}
            onChange={handleFieldChange}
            className="edit-category-select"
          >
            <option key="meeting" value="Meeting">Meeting</option>
            <option key="training" value="Training">Training</option>
            <option key="social" value="Social">Social Event</option>
            <option key="deadline" value="Deadline">Deadline</option>
            <option key="birthday" value="Birthday">Birthday</option>
          </select>
        ) : (
          <>
            <span className={`category-${editedEvent.category.toLowerCase().replace(' ', '-')}`}>
              {editedEvent.category}
              {editedEvent.category === 'Birthday' && <FontAwesomeIcon icon={faBirthdayCake} className="ml-2" />}
            </span>
            {editedEvent.isOpenEvent && <span className="open-event-badge">Open Event</span>}
          </>
        )}
      </div>
      
      <div className="event-meta">
        <div className="meta-item">
          <FontAwesomeIcon icon={faCalendarAlt} className="meta-icon" />
          <div>
            <div className="meta-label">Date</div>
            {isEditing ? (
              <input
                type="date"
                name="eventDateTime"
                value={format(new Date(editedEvent.eventDateTime), 'yyyy-MM-dd')}
                onChange={handleFieldChange}
                className="edit-date-input"
              />
            ) : (
              <div>{format(startDate, 'EEEE, MMMM do yyyy')}</div>
            )}
          </div>
        </div>
        
        <div className="meta-item">
          <FontAwesomeIcon icon={faClock} className="meta-icon" />
          <div>
            <div className="meta-label">Time</div>
            {isEditing ? (
              <div className="time-edit-container">
                <input
                  type="time"
                  name="eventDateTime"
                  value={format(new Date(editedEvent.eventDateTime), 'HH:mm')}
                  onChange={handleFieldChange}
                  className="edit-time-input"
                />
                <span>to</span>
                <input
                  type="time"
                  name="endDateTime"
                  value={format(new Date(editedEvent.endDateTime), 'HH:mm')}
                  onChange={handleFieldChange}
                  className="edit-time-input"
                />
              </div>
            ) : (
              <div>
                {format(startDate, 'h:mm a')} - {format(endDate, 'h:mm a')}
                <span className="duration">({formatDistanceToNow(endDate, { start: startDate })})</span>
              </div>
            )}
          </div>
        </div>
        
        <div className="meta-item">
          <FontAwesomeIcon icon={faMapMarkerAlt} className="meta-icon" />
          <div>
            <div className="meta-label">Location</div>
            {isEditing ? (
              <input
                type="text"
                name="location"
                value={editedEvent.location}
                onChange={handleFieldChange}
                className="edit-location-input"
              />
            ) : (
              <div>{editedEvent.location || 'Not specified'}</div>
            )}
          </div>
        </div>
        
        <div className="meta-item">
          <FontAwesomeIcon icon={faUsers} className="meta-icon" />
          <div>
            <div className="meta-label">Organizer</div>
            <div><UserBadge userId={editedEvent.organizer}/>  {}</div>
          </div>
        </div>
      </div>
      
      <div className="event-description">
        <h3>
          <FontAwesomeIcon icon={faFileAlt} className="section-icon" />
          Description
        </h3>
        {isEditing ? (
          <textarea
            name="description"
            value={editedEvent.description}
            onChange={handleFieldChange}
            className="edit-description-textarea"
          />
        ) : (
          <p>{editedEvent.description || 'No description provided.'}</p>
        )}
      </div>
      <AttendeeManagement 
        event={event} 
        isOrganizer={isOrganizer} 
        onUpdate={onUpdate}
        isEditing={isEditing}
      />
      
      {isEditing && (
        <div className="event-open-checkbox">
          <label>
            <input
              type="checkbox"
              name="isOpenEvent"
              checked={editedEvent.isOpenEvent}
              onChange={handleFieldChange}
            />
            Open Event (no RSVP needed)
          </label>
        </div>
      )}
      
      <div className="event-actions">
        <button className="google-calendar-btn" onClick={addToGoogleCalendar}>
          <FontAwesomeIcon icon={faGoogle} /> Add to Google Calendar
        </button>
        
        {isOrganizer && (
          <>
            {isEditing ? (
              <>
                <button 
                  className="save-btn" 
                  onClick={handleSaveChanges}
                  disabled={isSaving}
                >
                  <FontAwesomeIcon icon={faSave} /> 
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </button>
                <button 
                  className="cancel-btn" 
                  onClick={handleEditToggle}
                  disabled={isSaving}
                >
                  <FontAwesomeIcon icon={faTimes} /> Cancel
                </button>
              </>
            ) : (
              <button className="edit-btn" onClick={handleEditToggle}>
                <FontAwesomeIcon icon={faEdit} /> Edit Event
              </button>
            )}
            
            <button 
              className="delete-btn" 
              onClick={handleDeleteEvent}
              disabled={isDeleting || isEditing}
            >
              <FontAwesomeIcon icon={faTrashAlt} /> 
              {isDeleting ? 'Deleting...' : 'Delete Event'}
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default EventDetails;