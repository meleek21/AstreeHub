import React, { useState, useEffect, useCallback } from 'react';
import { userAPI } from '../../services/apiServices';
import useOnlineStatus from '../../hooks/useOnlineStatus';
import UserBadge from '../UserBadge';
import '../../assets/Css/ChatSidebar.css';

const ChatSidebar = ({ onSelectEmployee }) => {
  const [employees, setEmployees] = useState([]);
  const [filteredEmployees, setFilteredEmployees] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { isUserOnline } = useOnlineStatus();

  // Fetch all employees
  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        setLoading(true);
        const response = await userAPI.getAllEmployees();
        setEmployees(response.data);
        setFilteredEmployees(response.data);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching employees:', error);
        setError('Failed to load employees');
        setLoading(false);
      }
    };

    fetchEmployees();
  }, []);

  // Debounce search function
  const debounce = (func, delay) => {
    let timeoutId;
    return (...args) => {
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        func(...args);
      }, delay);
    };
  };

  // Filter employees based on search term
  const filterEmployees = useCallback(
    debounce((searchValue) => {
      if (!searchValue.trim()) {
        setFilteredEmployees(employees);
        return;
      }

      const filtered = employees.filter((employee) => {
        const fullName = `${employee.firstName} ${employee.lastName}`.toLowerCase();
        return fullName.includes(searchValue.toLowerCase());
      });

      setFilteredEmployees(filtered);
    }, 300),
    [employees]
  );

  // Handle search input change
  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    filterEmployees(value);
  };

  if (loading) {
    return (
      <div className="chat-sidebar">
        <h2>Contacts</h2>
        <div className="loading-message">Loading contacts...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="chat-sidebar">
        <h2>Contacts</h2>
        <div className="error-message">{error}</div>
      </div>
    );
  }

  return (
    <div className="chat-sidebar">
      <h2>Contacts</h2>
      <div className="search-container">
        <input
          type="text"
          placeholder="Search contacts..."
          value={searchTerm}
          onChange={handleSearchChange}
          className="search-input"
        />
      </div>
      {filteredEmployees.length === 0 ? (
        <div className="empty-list">No contacts found</div>
      ) : (
        <div className="employee-list">
          {filteredEmployees.map((employee) => (
            <div
              key={employee.id}
              className="employee-item"
              onClick={() => onSelectEmployee(employee)}
            >
              <UserBadge userId={employee.id} />
              <div className="employee-info">

                <span className={`status-indicator ${isUserOnline(employee.id) ? 'online' : 'offline'}`}>
                  {isUserOnline(employee.id) ? 'Online' : 'Offline'}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ChatSidebar;