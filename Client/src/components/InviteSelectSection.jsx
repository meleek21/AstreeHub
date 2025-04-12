import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUserFriends } from '@fortawesome/free-solid-svg-icons';

const InviteSelectSection = ({
  departments,
  selectedDepartment,
  departmentEmployees,
  selectedEmployees,
  handleDepartmentChange,
  toggleEmployeeSelection,
  handleInviteSelected,
  isSending
}) => (
  <div className="invite-select-section mt-3">
    <div className="form-group">
      <label>Select Department to Filter Employees:</label>
      <select 
        className="form-control" 
        value={selectedDepartment} 
        onChange={(e) => handleDepartmentChange(e.target.value)}
        disabled={isSending}
      >
        <option value="">Select a department</option>
        {departments.map(dept => (
          <option key={dept.id} value={dept.id}>{dept.name}</option>
        ))}
      </select>
    </div>
    
    {selectedDepartment && departmentEmployees.length > 0 && (
      <div className="employee-selection-list mt-3">
        <div className="employee-checkboxes">
          {departmentEmployees.map(emp => (
            <div key={emp.id} className="form-check">
              <input 
                type="checkbox" 
                className="form-check-input" 
                id={`emp-${emp.id}`} 
                checked={selectedEmployees.some(e => e.id === emp.id)}
                onChange={() => toggleEmployeeSelection(emp)}
                disabled={isSending}
              />
              <label className="form-check-label" htmlFor={`emp-${emp.id}`}>
                {emp.name} ({emp.department})
              </label>
            </div>
          ))}
        </div>
        
        <button 
          className="btn btn-success mt-3" 
          onClick={handleInviteSelected}
          disabled={isSending || selectedEmployees.length === 0}
        >
          {isSending ? (
            <>
              <span className="spinner-border spinner-border-sm mr-2" role="status" aria-hidden="true" />
              Sending...
            </>
          ) : (
            <>
              <FontAwesomeIcon icon={faUserFriends} className="mr-2" />
              Invite Selected ({selectedEmployees.length})
            </>
          )}
        </button>
      </div>
    )}
  </div>
);
export default InviteSelectSection;