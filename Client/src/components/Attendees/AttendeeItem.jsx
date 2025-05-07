import React from 'react';
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
  console.log('is final', isFinal);
  return (
    <div className="attendee-item">
      <div className="attendee-info">
        <UserBadge userId={attendeeId} showBirthday={true} />
      </div>
      <div className="attendee-actions">
        {(user.id === attendeeId && event && !event.isOpenEvent) ? (
          <div className="btn-group btn-group-sm ml-2">
            <button 
              className={`btn accepted${status === 'Accepté' ? 'btn-success active' : 'btn-outline-success'}`}
              onClick={() => handleStatusChange('Accepté')}
              disabled={isFinal}
            >
              <FontAwesomeIcon icon={faCheck} />
              <span className="button-text">Accepter</span>
            </button>
            <button 
              className={`btn ${status === 'Refusé' ? 'btn-danger active' : 'btn-outline-danger'}`}
              onClick={() => handleStatusChange('Refusé')}
              disabled={isFinal}
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