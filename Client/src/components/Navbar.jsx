import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaCog, FaSignOutAlt } from 'react-icons/fa';
import { useAuth } from '../Context/AuthContext';

function Navbar() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  
  const loggedInUser = {
    name: user?.firstName ? `${user.firstName} ${user.lastName}` : 'User',
    avatar: 'https://via.placeholder.com/40',
  };

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  const handleLogout = () => {
    // Use the logout function from AuthContext which properly handles token removal
    logout();
    // No need to navigate here as the logout function in AuthContext already handles navigation
  };

  return (
    <nav className="nav-bar">
      {/* Logo */}
      <div className="navbar-brand">
        <Link to="/" className="logo-link">Astree.net</Link>
      </div>

      {/* Home Link */}
      <div className="navbar-home">
        <Link to="/" className="nav-link">
          <lord-icon
            src="https://cdn.lordicon.com/wmwqvixz.json"
            trigger="hover"
            colors="primary:#0047AB,secondary:#00CED1"
            style={{ width: '30px', height: '30px' }}
          ></lord-icon>
          
        </Link>
      </div>

      {/* Notifications */}
      <div className="navbar-home">
        <Link to="/" className="nav-link">
          <lord-icon
            src="https://cdn.lordicon.com/lznlxwtc.json"
            trigger="hover"
            colors="primary:#0047AB,secondary:#00CED1"
            style={{ width: '30px', height: '30px' }}
          ></lord-icon>
          
        </Link>
      </div>

      {/* Search Bar */}
      <div className="search-bar">
        <lord-icon
          src="https://cdn.lordicon.com/fkdzyfle.json"
          trigger="hover"
          colors="primary:#FF6600,secondary:#FF9933"
          style={{ width: '30px', height: '30px' }}
        ></lord-icon>
        <input type="text" placeholder="Rechercher..." />
      </div>

      {/* User Dropdown */}
      <div className="user-dropdown">
        <span className="welcome-text">Bienvenue, {loggedInUser.name}</span>
        <div className="dropdown">
          <button
            className="dropdown-toggle"
            onClick={toggleDropdown}
            onMouseEnter={() => setIsDropdownOpen(false)}
            title="Compte"
          >
            <lord-icon
              src="https://cdn.lordicon.com/hrjifpbq.json"
              trigger="hover"
              colors="primary:#FF6600,secondary:#FF9933"
              style={{ width: '30px', height: '30px' }}
            ></lord-icon>
          </button>

          {isDropdownOpen && (
            <div className="dropdown-content">
              <Link to="/settings" className="dropdown-link">
                <FaCog /> Paramètres
              </Link>
              <button onClick={handleLogout} className="logout-button">
                <FaSignOutAlt /> Déconnexion
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}

export default Navbar;