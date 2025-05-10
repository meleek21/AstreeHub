import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch, faGlobe, faBuilding, faUserFriends } from '@fortawesome/free-solid-svg-icons';

const InvitationModeSelector = ({ inviteMode, setInviteMode, searchQuery, setSearchQuery }) => (
  <div className="invitation-mode-selector">
    <div className="d-flex flex-column w-100 mb-3">
      {inviteMode === 'select' && (
        <div className="search-bar-container mb-2">
          <div className="input-group">
            <div className="input-group-prepend">
              <span className="input-group-text">
                <FontAwesomeIcon icon={faSearch} />
              </span>
            </div>
            <input
              type="text"
              className="form-control"
              placeholder="Rechercher des utilisateurs..."
              value={searchQuery || ''}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label="Rechercher des utilisateurs"
            />
          </div>
        </div>
      )}
      <div className="d-flex">
        <button 
          className={`btn ${inviteMode === 'all' ? 'btn-primary' : 'btn-outline-primary'} mr-2`}
          onClick={() => setInviteMode('all')}
        >
          <FontAwesomeIcon icon={faGlobe} /> Tous
        </button>
        <button 
          className={`btn ${inviteMode === 'department' ? 'btn-primary' : 'btn-outline-primary'} mr-2`}
          onClick={() => setInviteMode('department')}
        >
          <FontAwesomeIcon icon={faBuilding} /> Département
        </button>
        <button 
          className={`btn ${inviteMode === 'select' ? 'btn-primary' : 'btn-outline-primary'}`}
          onClick={() => setInviteMode('select')}
        >
          <FontAwesomeIcon icon={faUserFriends} /> Sélectionner les employés
        </button>
      </div>
    </div>
  </div>
);
export default InvitationModeSelector;