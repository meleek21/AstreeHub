import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch } from '@fortawesome/free-solid-svg-icons';

const SearchAttendees = ({
  searchQuery,
  setSearchQuery,
  searchResults,
  handleSearch,
  handleAddAttendee,
  isLoading
}) => (
  <div className="attendee-search mb-3">
    <div className="input-group">
      <input
        type="text"
        className="form-control"
        placeholder="Search employees to add..."
        value={searchQuery}
        onChange={(e) => {
          setSearchQuery(e.target.value);
          handleSearch(e.target.value);
        }}
      />
      <div className="input-group-append">
        <span className="input-group-text">
          <FontAwesomeIcon icon={faSearch} />
        </span>
      </div>
    </div>

    {searchResults.length > 0 && (
      <div className="search-results">
        {searchResults.map(emp => (
          <div key={emp.id} className="search-result-item">
            <span>{emp.name} ({emp.department})</span>
            <button 
              className="btn btn-sm btn-primary"
              onClick={() => handleAddAttendee(emp)}
            >
              <FontAwesomeIcon icon={faUserPlus} /> Add
            </button>
          </div>
        ))}
      </div>
    )}
  </div>
);
export default SearchAttendees;