import React from 'react';
import UserBadge from './UserBadge';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheck, faTimes, faUserMinus } from '@fortawesome/free-solid-svg-icons';

const AttendeeItem = ({
  attendeeId,
  isOrganizer,
  isEditing,
  user,
  userAttendanceStatus,
  handleStatusChange,
  handleRemoveAttendee,
  event
}) => {
  const getStatus = () => attendeeId === user.id ? userAttendanceStatus.status : 'Pending';

  return (
    <div className="attendee-item">
      <div className="attendee-info">
        <UserBadge userId={attendeeId} showBirthday={true} />
      </div>
      <div className="attendee-actions">
        {isOrganizer && user.id === attendeeId ? (
          <div className="btn-group btn-group-sm ml-2">
            <button 
              className={`btn ${getStatus() === 'Accepted' ? 'btn-success active' : 'btn-outline-success'}`}
              onClick={() => handleStatusChange('Accepted')}
              disabled={userAttendanceStatus.isFinal}
            >
              <FontAwesomeIcon icon={faCheck} />
              <span className="button-text">Accept</span>
            </button>
            <button 
              className={`btn ${getStatus() === 'Declined' ? 'btn-danger active' : 'btn-outline-danger'}`}
              onClick={() => handleStatusChange('Declined')}
              disabled={userAttendanceStatus.isFinal}
            >
              <FontAwesomeIcon icon={faTimes} />
              <span className="button-text">Decline</span>
            </button>
          </div>
        ) : isOrganizer && isEditing ? (
          <button 
            className="btn btn-sm btn-danger"
            onClick={() => handleRemoveAttendee(attendeeId)}
          >
            <FontAwesomeIcon icon={faUserMinus} /> Remove
          </button>
        ) : null}
      </div>
    </div>
  );
};
export default AttendeeItem;