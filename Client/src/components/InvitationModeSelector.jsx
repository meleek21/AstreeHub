import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch, faGlobe, faBuilding, faUserFriends } from '@fortawesome/free-solid-svg-icons';

const InvitationModeSelector = ({ inviteMode, setInviteMode }) => (
  <div className="invitation-mode-selector">
    <button 
      className={`btn ${inviteMode === 'search' ? 'btn-primary' : 'btn-outline-primary'} mr-2`}
      onClick={() => setInviteMode('search')}
    >
      <FontAwesomeIcon icon={faSearch} /> Search
    </button>
    <button 
      className={`btn ${inviteMode === 'all' ? 'btn-primary' : 'btn-outline-primary'} mr-2`}
      onClick={() => setInviteMode('all')}
    >
      <FontAwesomeIcon icon={faGlobe} /> Everyone
    </button>
    <button 
      className={`btn ${inviteMode === 'department' ? 'btn-primary' : 'btn-outline-primary'} mr-2`}
      onClick={() => setInviteMode('department')}
    >
      <FontAwesomeIcon icon={faBuilding} /> Department
    </button>
    <button 
      className={`btn ${inviteMode === 'select' ? 'btn-primary' : 'btn-outline-primary'}`}
      onClick={() => setInviteMode('select')}
    >
      <FontAwesomeIcon icon={faUserFriends} /> Select Employees
    </button>
  </div>
);
export default InvitationModeSelector;