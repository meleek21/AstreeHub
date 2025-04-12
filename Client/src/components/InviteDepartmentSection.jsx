import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBuilding } from '@fortawesome/free-solid-svg-icons';

const InviteDepartmentSection = ({
  departments,
  selectedDepartment,
  handleDepartmentChange,
  handleInviteDepartment,
  isSending
}) => (
  <div className="invite-department-section mt-3">
    <div className="form-group">
      <label>Select Department:</label>
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
    
    {selectedDepartment && (
      <div className="mt-3">
        <button 
          className="btn btn-success" 
          onClick={handleInviteDepartment}
          disabled={isSending}
        >
          {isSending ? (
            <>
              <span className="spinner-border spinner-border-sm mr-2" role="status" aria-hidden="true" />
              Sending...
            </>
          ) : (
            <>
              <FontAwesomeIcon icon={faBuilding} className="mr-2" />
              Send to Department
            </>
          )}
        </button>
      </div>
    )}
  </div>
);
export default InviteDepartmentSection;