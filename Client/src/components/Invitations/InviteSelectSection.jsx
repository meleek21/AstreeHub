import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUserFriends } from '@fortawesome/free-solid-svg-icons';
import AttendeeItem from '../Attendees/AttendeeItem';

const InviteSelectSection = ({
  employees = [],
  organizerDepartmentId,
  selectedEmployees,
  toggleEmployeeSelection,
  handleInviteSelected,
  isSending
}) => {
  // Sort employees: those from organizer's department first, then others alphabetically
  const sortedEmployees = [...employees].sort((a, b) => {
    const aIsDept = a.departmentId === organizerDepartmentId;
    const bIsDept = b.departmentId === organizerDepartmentId;
    if (aIsDept && !bIsDept) return -1;
    if (!aIsDept && bIsDept) return 1;
    const aName = a.name || "";
    const bName = b.name || "";
    return aName.localeCompare(bName);
  });

  return (
    <div className="invite-select-section mt-3">
      <div className="all-employee-list  mt-3">
        <div className="employee-checkboxes">
          {sortedEmployees.map(emp => (
            <div key={emp.id} className="d-flex align-items-center mb-2">
              <input 
                type="checkbox" 
                className="form-check-input mr-2" 
                id={`emp-${emp.id}`} 
                checked={selectedEmployees.some(e => e.id === emp.id)}
                onChange={() => toggleEmployeeSelection(emp)}
                disabled={isSending}
              />
              <AttendeeItem
                attendeeId={emp.id}
                isOrganizer={false}
                isEditing={false}
                user={emp}
                userAttendanceStatus={{status: 'En attente', isFinal: false}}
                handleStatusChange={() => {}}
                handleRemoveAttendee={() => {}}
                event={null}
              />
            </div>
          ))}
        </div>
        
      </div>
      <button 
          className="btn btn-success mt-3" 
          onClick={handleInviteSelected}
          disabled={isSending || selectedEmployees.length === 0}
        >
          {isSending ? (
            <>
              <span className="spinner-border spinner-border-sm mr-2" role="status" aria-hidden="true" />
              Envoi en cours...
            </>
          ) : (
            <>
              <FontAwesomeIcon icon={faUserFriends} className="mr-2" />
              Inviter la sélection ({selectedEmployees.length})
            </>
          )}
        </button>
    </div>
  );
};
export default InviteSelectSection;