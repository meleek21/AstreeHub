import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch, faInfoCircle } from '@fortawesome/free-solid-svg-icons';

const SearchAttendees = ({
  searchQuery,
  setSearchQuery,
  attendees,
  isLoading
}) => {
  // Cette fonction est maintenant utilisée pour filtrer les participants existants
  // au lieu de rechercher de nouveaux utilisateurs à inviter
  return (
    <div className="attendee-search mb-3">
      <div className="search-info">
        <FontAwesomeIcon icon={faInfoCircle} className="info-icon" />
        <span>Filtrer les participants déjà invités</span>
      </div>
      <div className="input-group">
        <input
          type="text"
          className="form-control"
          placeholder="Rechercher parmi les participants invités..."
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
          }}
        />
        <div className="input-group-append">
          <span className="input-group-text">
            <FontAwesomeIcon icon={faSearch} />
          </span>
        </div>
      </div>
    </div>
  );
};

export default SearchAttendees;