import React, { useState, useEffect } from 'react';
import UserBadge from '../UserBadge';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheck, faTimes, faUserMinus } from '@fortawesome/free-solid-svg-icons';

const AttendeeItem = ({
  attendeeId,
  isOrganizer,
  isEditing,
  user,
  status,
  isFinal,
  handleStatusChange,
  handleRemoveAttendee,
  event
}) => {
  // Local state to track status and final state without requiring page refresh
  const [localStatus, setLocalStatus] = useState(status);
  const [localIsFinal, setLocalIsFinal] = useState(isFinal);
  
  // Update local state when props change
  useEffect(() => {
    setLocalStatus(status);
    setLocalIsFinal(isFinal);
  }, [status, isFinal]);
  
  // Handle status change with local state update
  const onStatusChange = async (newStatus) => {
    try {
      // Update local state immediately for responsive UI
      setLocalStatus(newStatus);
      
      // Call the parent handler
      await handleStatusChange(newStatus);
      
      // After successful API call, update the final state
      setLocalIsFinal(true);
    } catch (error) {
      // If there's an error, revert to previous state
      setLocalStatus(status);
      console.error('Failed to update status:', error);
    }
  };
  
  return (
    <div className="attendee-item">
      <div className="attendee-info">
        <UserBadge userId={attendeeId} showBirthday={true} />
      </div>
      <div className="attendee-actions">
        {(user.id === attendeeId && event && !event.isOpenEvent) ? (
          <div className="btn-group btn-group-sm ml-2">
            <button 
              className={`btn ${localStatus === 'Accepté' ? 'btn-success active' : 'btn-outline-success'}`}
              onClick={() => onStatusChange('Accepté')}
              disabled={localIsFinal}
            >
              <FontAwesomeIcon icon={faCheck} />
              <span className="button-text">Accepter</span>
            </button>
            <button 
              className={`btn ${localStatus === 'Refusé' ? 'btn-danger active' : 'btn-outline-danger'}`}
              onClick={() => onStatusChange('Refusé')}
              disabled={localIsFinal}
            >
              <FontAwesomeIcon icon={faTimes} />
              <span className="button-text">Refuser</span>
            </button>
          </div>
        ) : isOrganizer && isEditing ? (
          <button 
            className="cancel-btn"
            onClick={() => handleRemoveAttendee(attendeeId)}
          >
            <FontAwesomeIcon icon={faUserMinus} /> Supprimer
          </button>
        ) : null}
      </div>
    </div>
  );
};

export default AttendeeItem;