import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaCog, FaSignOutAlt } from 'react-icons/fa';
import { useAuth } from '../Context/AuthContext';
import { userAPI, userOnlineStatusAPI as userStatusAPI } from '../services/apiServices';

function Navbar() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const userId = user?.id;

  // Default profile picture URL
  const defaultProfilePicture = 'https://res.cloudinary.com/REMOVED/image/upload/frheqydmq3cexbfntd7e.jpg';

  const [userInfo, setUserInfo] = useState({
    firstName: '',
    lastName: '',
    profilePicture: defaultProfilePicture,
    isOnline: false,
  });

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Fetch user info
  const fetchUserInfo = async () => {
    if (!userId) return;

    try {
      const [userInfoResponse, userStatusResponse] = await Promise.all([
        userAPI.getUserInfo(userId),
        userStatusAPI.getUserStatus(userId),
      ]);
      setUserInfo({
        firstName: userInfoResponse.data.firstName,
        lastName: userInfoResponse.data.lastName,
        profilePicture: userInfoResponse.data.profilePictureUrl || defaultProfilePicture,
        isOnline: userStatusResponse.data.isOnline,
      });
    } catch (error) {
      console.error('Error fetching user info:', error);
    }
  };

  useEffect(() => {
    fetchUserInfo();
  }, [userId]);

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
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
        <span className="welcome-text">Bienvenue, {userInfo.firstName} {userInfo.lastName}</span>
        <div className="dropdown">
          {/* Clickable Profile Picture */}
          <div className="user-avatar-container" onClick={toggleDropdown}>
            <img
              src={userInfo.profilePicture}
              alt={`${userInfo.firstName} ${userInfo.lastName}`}
              className="user-avatar"
            />
            <lord-icon
              src="https://cdn.lordicon.com/xcrjfuzb.json"
              trigger="morph"
              state="hover-arrow-down-2"
              colors="primary:#6ED3CF"
              style={{width:'25px',height:'25px',position:'absolute',right:'0',bottom:'0',marginBottom:'-5px',marginRight:'-6px'}}>
            </lord-icon>
          </div>

          {/* Dropdown Content */}
          {isDropdownOpen && (
            <div className="dropdown-content">
              <Link to={`/profile/edit/${userId}`} className="dropdown-link">
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