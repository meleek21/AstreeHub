import React, { useState, useEffect } from 'react';
import { messagesAPI,  userAPI } from '../../services/apiServices';
import '../../assets/Css/CreateGroupChat.css';

const CreateGroupChat = ({ isOpen, onClose, onGroupCreated }) => {
  const [groupName, setGroupName] = useState('');
  const [employees, setEmployees] = useState([]);
  const [selectedEmployees, setSelectedEmployees] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const currentUserId = localStorage.getItem('userId');
  
  // Fetch employees when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchEmployees();
      // Reset form when modal opens
      setGroupName('');
      setSelectedEmployees([]);
      setSearchTerm('');
      setError(null);
    }
  }, [isOpen]);
  
  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const response = await userAPI.getAllEmployees();
      setEmployees(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching employees:', error);
      setError('Failed to load employees');
      setLoading(false);
    }
  };
  
  // Filter employees based on search term
  const filteredEmployees = employees.filter((employee) => {
    const fullName = `${employee.firstName} ${employee.lastName}`.toLowerCase();
    return fullName.includes(searchTerm.toLowerCase());
  });
  
  // Handle employee selection
  const handleEmployeeSelect = (employeeId) => {
    setSelectedEmployees((prev) => {
      if (prev.includes(employeeId)) {
        return prev.filter((id) => id !== employeeId);
      } else {
        return [...prev, employeeId];
      }
    });
  };
  
  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    e.stopPropagation(); // Prevent event bubbling
    
    if (!groupName.trim()) {
      setError('Please enter a group name');
      return;
    }
    
    if (selectedEmployees.length < 2) {
      setError('Please select at least 2 employees for the group');
      return;
    }
    
    try {
      setLoading(true);
      
      // Ensure current user is included in the group
      let participantIds = [...selectedEmployees];
      if (!participantIds.includes(currentUserId)) {
        participantIds.push(currentUserId);
      }
      
      const response = await messagesAPI.createGroupConversation(participantIds, groupName);
      onGroupCreated(response.data);
      resetForm();
      onClose();
    } catch (error) {
      console.error('Error creating group chat:', error);
      setError('Failed to create group chat');
      setLoading(false);
    }
  };
  
  // Reset form
  const resetForm = () => {
    setGroupName('');
    setSelectedEmployees([]);
    setSearchTerm('');
    setError(null);
  };
  
  // Handle modal overlay click
  const handleOverlayClick = (e) => {
    // Only close if clicking directly on the overlay, not its children
    if (e.target.className === 'modal-overlay') {
      onClose();
    }
  };
  
  // Handle close button click
  const handleCloseClick = (e) => {
    e.preventDefault();
    e.stopPropagation(); // Prevent event bubbling
    onClose();
  };
  
  if (!isOpen) return null;
  
  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Create Group Chat</h2>
          <button className="close-button" onClick={handleCloseClick}>×</button>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="groupName">Group Name</label>
            <input
              type="text"
              id="groupName"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              placeholder="Enter group name"
              required
            />
          </div>
          
          <div className="form-group">
            <label>Select Participants</label>
            <input
              type="text"
              placeholder="Search employees..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>
          
          {error && <div className="error-message">{error}</div>}
          
          <div className="employee-selection">
            {loading ? (
              <div className="loading-message">Loading employees...</div>
            ) : filteredEmployees.length === 0 ? (
              <div className="empty-list">No employees found</div>
            ) : (
              filteredEmployees.map((employee) => (
                <div 
                  key={employee.id} 
                  className={`employee-checkbox ${selectedEmployees.includes(employee.id) ? 'selected' : ''}`}
                  onClick={() => handleEmployeeSelect(employee.id)}
                >
                  <input
                    type="checkbox"
                    id={`employee-${employee.id}`}
                    checked={selectedEmployees.includes(employee.id)}
                    onChange={() => {}} // Handled by the div click
                    aria-label={`Select ${employee.firstName} ${employee.lastName}`}
                  />
                  <label htmlFor={`employee-${employee.id}`}>
                    {employee.firstName} {employee.lastName}
                    {employee.department && (
                      <span className="department-label">{employee.department.name}</span>
                    )}
                  </label>
                </div>
              ))
            )}
          </div>
          
          <div className="modal-footer">
            <button 
              type="button" 
              className="cancel-button" 
              onClick={handleCloseClick}
              disabled={loading}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="create-button" 
              disabled={loading || selectedEmployees.length < 2 || !groupName.trim()}
            >
              {loading ? 'Creating...' : 'Create Group'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateGroupChat;
