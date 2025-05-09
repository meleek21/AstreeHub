import React, { useState, useEffect, useCallback, useRef } from 'react';
import { userAPI } from '../../services/apiServices';
import UserBadge from '../UserBadge';
import '../../assets/Css/ChatSidebar.css';
import MiniCalendar from '../MiniCalendar';
import ModalPortal from '../ModalPortal';
import { useChat } from '../../Context/ChatContext';
import { useAuth } from '../../Context/AuthContext';

const ChatSidebar = () => {
  const { conversations, setConversations, selectedConversation, setSelectedConversation, messages, setMessages, loading, setLoading, unreadCount, setUnreadCount, selectedEmployee, setSelectedEmployee, handleSelectEmployee } = useChat();
  const { user } = useAuth();
  const [employees, setEmployees] = useState([]);
  const [filteredEmployees, setFilteredEmployees] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [isSidebarVisible, setSidebarVisible] = useState(false);
  const [error, setError] = useState(null);
  const sidebarRef = useRef(null);

  const toggleSidebarVisibility = () => {
    setSidebarVisible(!isSidebarVisible);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (sidebarRef.current && !sidebarRef.current.contains(event.target)) {
        setSidebarVisible(false);
      }
    };

    if (isSidebarVisible) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isSidebarVisible]);
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
    <div>
      <button className="peeking-ticket" onClick={toggleSidebarVisibility}>
      <lord-icon
        src="https://cdn.lordicon.com/wjogzler.json"
        trigger="hover"
        colors="primary:#ffebd0ff"
        style={{width: '35px',height: '35px',transform: 'rotate(-180deg)' ,transition: 'transform 0.3s ease'}}>
      </lord-icon>
      <span className="peeking-tooltip">une date? un collegue?</span>
      </button>
      {isSidebarVisible && (
        <ModalPortal>
          <div className="group-sidebar-overlay">
            <div className="group-sidebar" ref={sidebarRef}>
              <MiniCalendar/>
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
                      onClick={() => handleSelectEmployee(employee, user)}
                    >
                      <UserBadge userId={employee.id} />
                      <div className="employee-info">
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </ModalPortal>
      )}
    </div>
  );
};

export default ChatSidebar;