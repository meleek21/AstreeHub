import React, { useState, useEffect, useCallback } from 'react';
import { userAPI } from '../../services/apiServices';
import useOnlineStatus from '../../hooks/useOnlineStatus';
import '../../assets/Css/EmployeeList.css';

const EmployeeList = ({ onSelectEmployee }) => {
  const [employees, setEmployees] = useState([]);
  const [filteredEmployees, setFilteredEmployees] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
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
  
  // Use the centralized online status hook
  const { isUserOnline } = useOnlineStatus();
  
  if (loading) {
    return (
      <div className="employee-list-container">
        <h2>Employees</h2>
        <div className="loading-message">Loading employees...</div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="employee-list-container">
        <h2>Employees</h2>
        <div className="error-message">{error}</div>
      </div>
    );
  }
  
  return (
    <div className="employee-list-container">
      <h2>Employees</h2>
      
      <div className="search-container">
        <input
          type="text"
          placeholder="Search employees..."
          value={searchTerm}
          onChange={handleSearchChange}
          className="search-input"
        />
      </div>
      
      {filteredEmployees.length === 0 ? (
        <div className="empty-list">No employees found</div>
      ) : (
        <div className="employee-items">
          {filteredEmployees.map((employee) => {
            const isOnline = isUserOnline(employee.id);
            
            return (
              <div 
                key={employee.id} 
                className="employee-item"
                onClick={() => onSelectEmployee(employee)}
              >
                <div className="employee-info">
                  <div className="employee-name">
                    {employee.firstName} {employee.lastName}
                    <span className={`status-indicator ${isOnline ? 'online' : 'offline'}`}></span>
                  </div>
                  {employee.department && (
                    <div className="employee-department">{employee.department.name}</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default EmployeeList;