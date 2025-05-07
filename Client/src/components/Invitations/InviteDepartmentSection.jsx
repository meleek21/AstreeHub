import React from 'react';
import { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBuilding } from '@fortawesome/free-solid-svg-icons';
import { departmentAPI } from '../../services/apiServices';
import AttendeeItem from '../Attendees/AttendeeItem';

const InviteDepartmentSection = ({
  departments,
  selectedDepartment,
  handleDepartmentChange,
  handleInviteDepartment,
  isSending,
  user,
  isOrganizer,
  isEditing,
  userAttendanceStatus,
  handleStatusChange,
  handleRemoveAttendee,
  event
}) => {
  const [departmentEmployees, setDepartmentEmployees] = useState([]);
  const [isLoadingEmployees, setIsLoadingEmployees] = useState(false);

  useEffect(() => {
    const fetchEmployees = async () => {
      if (selectedDepartment) {
        setIsLoadingEmployees(true);
        console.log('selected dep',selectedDepartment);
        try {
          const response = await departmentAPI.getEmployeesInDepartment(selectedDepartment);
          console.log('response',response.data)
          setDepartmentEmployees(response.data);

        } catch (error) {
          console.error('Error fetching department employees:', error);
        } finally {
          setIsLoadingEmployees(false);
        }
      } else {
        setDepartmentEmployees([]);
      }
    };
    fetchEmployees();
  }, [selectedDepartment]);

  return (
    <div className="invite-department-section mt-3">
      <div className="form-group">
        <label>Sélectionner un département :</label>
        <select 
          className="form-control" 
          value={selectedDepartment} 
          onChange={(e) => handleDepartmentChange(parseInt(e.target.value))}
          disabled={isSending}
        >
          <option value="">Sélectionner un département</option>
          {departments.map(dept => (
            <option key={dept.id} value={dept.id}>{dept.name}</option>
          ))}
        </select>
      </div>
      {isLoadingEmployees && <div>Chargement des employés...</div>}
      {selectedDepartment && departmentEmployees.length > 0 && (
        <div className="department-employee-list mt-3">
          {departmentEmployees.map(emp => (
            <AttendeeItem
              key={emp.id}
              attendeeId={emp.id}
              isOrganizer={isOrganizer}
              isEditing={isEditing}
              user={emp}
              status={userAttendanceStatus?.status || 'En attente'}
              isFinal={userAttendanceStatus?.isFinal ?? false}
              handleStatusChange={handleStatusChange}
              handleRemoveAttendee={handleRemoveAttendee}
              event={event}
            />
          ))}
        </div>
      )}
      <button 
        className="btn btn-primary mt-2" 
        onClick={handleInviteDepartment}
        disabled={isSending || !selectedDepartment}
      >
        {isSending ? 'Envoi en cours...' : 'Inviter le département'}
      </button>
    </div>
  );
};
export default InviteDepartmentSection;