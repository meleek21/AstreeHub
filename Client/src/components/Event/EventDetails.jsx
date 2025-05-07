import React, { useState, useEffect } from 'react';
import { eventsAPI } from '../../services/apiServices';
import toast from 'react-hot-toast';
import { useAuth } from '../../Context/AuthContext';
import EventDetailsView from './EventDetailsView';
import EventDetailsEdit from './EventDetailsEdit';
import '../../assets/Css/EventDetails.css';
const EventDetails = ({ event, onClose, onDelete, onUpdate }) => {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [editedEvent, setEditedEvent] = useState({ ...event });
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [userAttendanceStatus, setUserAttendanceStatus] = useState({ status: 'En attente', isFinal: false });

  const isOrganizer = user.id === editedEvent.organizer;

  // Map event type to a more readable format
  const getEventTypeLabel = (type) => {
    const typeMap = {
      'Général': 'Général',
      'Réunion': 'Réunion',
      'Formation': 'Formation',
      'ÉvénementEntreprise': "Événement d'entreprise",
      'Personnel': 'Personnel',
      'Technique': 'Technique'
    };
    return typeMap[type] || type;
  };

  useEffect(() => {
    const fetchUserStatus = async () => {
      if (!user?.id || isOrganizer || event.isOpenEvent) return;
      try {
        const { data } = await eventsAPI.getUserAttendanceStatus(event.id, user.id);
        setUserAttendanceStatus({
          status: data.status,
          isFinal: data.isFinal
        });
      } catch (error) {
        setUserAttendanceStatus({ status: 'En attente', isFinal: false });
      }
    };
    fetchUserStatus();
  }, [event.id, user?.id, isOrganizer, event.isOpenEvent, event.attendeeStatuses]);

  const getAttendeeStatus = (attendeeId) => {
    if (attendeeId === user.id) {
      return userAttendanceStatus.status;
    }
    return event.attendeeStatuses?.[attendeeId] || 'Pending';
  };

  const getAttendeeIsFinal = (attendeeId) => {
    if (attendeeId === user.id) {
      return userAttendanceStatus.isFinal;
    }
    return true;
  };

  const addToGoogleCalendar = () => {
    const startDate = new Date(editedEvent.eventDateTime);
    const endDate = editedEvent.endDateTime ? new Date(editedEvent.endDateTime) : new Date(startDate.getTime() + 60 * 60 * 1000);
    
    const startISO = startDate.toISOString().replace(/-|:|\.\d\d\d/g, '');
    const endISO = endDate.toISOString().replace(/-|:|\.\d\d\d/g, '');
    
    const googleCalendarUrl = `https://www.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(editedEvent.title)}&dates=${startISO}/${endISO}&details=${encodeURIComponent(editedEvent.description)}&location=${encodeURIComponent(editedEvent.location)}`;
    
    window.open(googleCalendarUrl, '_blank');
    toast.success('Opened Google Calendar');
  };

  const handleDeleteEvent = async () => {
    try {
      setIsDeleting(true);
      await eventsAPI.deleteEvent(editedEvent.id);
      toast.success('Événement supprimé avec succès');
      onDelete();
    } catch (error) {
      console.error('Failed to delete event:', error);
      toast.error('Échec de supprimer l\'événement');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleEditToggle = () => {
    setIsEditing(!isEditing);
    if (isEditing) {
      setEditedEvent({ ...event });
    }
  };

  const handleFieldChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (type === 'checkbox') {
      setEditedEvent(prev => ({
        ...prev,
        [name]: checked
      }));
      return;
    }
    
    // Handle date and time inputs specially
    if (name === 'eventDateTime' && type === 'date') {
      const currentDate = new Date(editedEvent.eventDateTime);
      const newDate = new Date(value);
      newDate.setHours(currentDate.getHours(), currentDate.getMinutes());
      
      setEditedEvent(prev => ({
        ...prev,
        eventDateTime: newDate.toISOString()
      }));
      return;
    }
    
    if (name === 'eventDateTime' && type === 'time') {
      const currentDate = new Date(editedEvent.eventDateTime);
      const [hours, minutes] = value.split(':');
      currentDate.setHours(parseInt(hours), parseInt(minutes));
      
      setEditedEvent(prev => ({
        ...prev,
        eventDateTime: currentDate.toISOString()
      }));
      return;
    }
    
    if (name === 'endDateTime' && type === 'time') {
      const currentEndDate = editedEvent.endDateTime ? new Date(editedEvent.endDateTime) : new Date(editedEvent.eventDateTime);
      const [hours, minutes] = value.split(':');
      currentEndDate.setHours(parseInt(hours), parseInt(minutes));
      
      setEditedEvent(prev => ({
        ...prev,
        endDateTime: currentEndDate.toISOString()
      }));
      return;
    }
    
    setEditedEvent(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSaveChanges = async () => {
    try {
      setIsSaving(true);
      // Basic validation
      if (!editedEvent.title || editedEvent.title.length < 5) {
        throw new Error('Title must be at least 5 characters');
      }
      
      if (!editedEvent.location) {
        throw new Error('Location is required');
      }
      
      if (!editedEvent.description) {
        throw new Error('Description is required');
      }
      
      if (!editedEvent.eventDateTime) {
        throw new Error('Start date and time are required');
      }
      
      if (!editedEvent.endDateTime) {
        throw new Error('End date and time are required');
      }
      
      const startDate = new Date(editedEvent.eventDateTime);
      const endDate = new Date(editedEvent.endDateTime);
      
      if (endDate <= startDate) {
        throw new Error('End time must be after start time');
      }

      const eventUpdateDto = {
        title: editedEvent.title,
        description: editedEvent.description,
        eventDateTime: editedEvent.eventDateTime,
        endDateTime: editedEvent.endDateTime,
        location: editedEvent.location,
        category: editedEvent.category,
        isOpenEvent: editedEvent.isOpenEvent,
        type: editedEvent.type
      };

      await eventsAPI.updateEvent(editedEvent.id, eventUpdateDto);
      toast.success('Événement mis à jour avec succès');
      setIsEditing(false);
      
      if (typeof onUpdate === 'function') {
        onUpdate();
      }
    } catch (error) {
      console.error('Failed to update event:', error);
      toast.error(error.message || 'Échec de mettre à jour l\'événement');
    } finally {
      setIsSaving(false);
    }
  };

  return isEditing ? (
    <EventDetailsEdit
      event={editedEvent}
      onClose={handleEditToggle}
      onSave={handleSaveChanges}
      onFieldChange={handleFieldChange}
      isSaving={isSaving}
      getEventTypeLabel={getEventTypeLabel}
    />
  ) : (
    <EventDetailsView
      event={editedEvent}
      onClose={onClose}
      isOrganizer={isOrganizer}
      user={user}
      onEditToggle={handleEditToggle}
      onDelete={handleDeleteEvent}
      addToGoogleCalendar={addToGoogleCalendar}
      getEventTypeLabel={getEventTypeLabel}
      userAttendanceStatus={userAttendanceStatus}
      getAttendeeStatus={getAttendeeStatus}
      getAttendeeIsFinal={getAttendeeIsFinal}
      onUpdate={onUpdate}
    />
  );
};

export default EventDetails;