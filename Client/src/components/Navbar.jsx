import React, { useEffect, useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaCog, FaSignOutAlt } from 'react-icons/fa';
import { useAuth } from '../Context/AuthContext';
import { userAPI, userOnlineStatusAPI as userStatusAPI } from '../services/apiServices';
import NotificationBell from './notifications/NotificationBell';
import SinglePostModal from './Posts/SinglePostModal';

function Navbar() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const userId = user?.id;

  const defaultProfilePicture = 'https://res.cloudinary.com/REMOVED/image/upload/frheqydmq3cexbfntd7e.jpg';

  const [userInfo, setUserInfo] = useState({
    firstName: '',
    lastName: '',
    profilePicture: defaultProfilePicture,
    isOnline: false,
  });

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const [isPostModalOpen, setIsPostModalOpen] = useState(false);
  const [modalPostId, setModalPostId] = useState(null);

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

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isDropdownOpen]);

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleOpenPostModal = (postId) => {
    setModalPostId(postId);
    setIsPostModalOpen(true);
  };
  const handleClosePostModal = () => {
    setIsPostModalOpen(false);
    setModalPostId(null);
  };

  return (
    <nav className="nav-bar">
      {/* Home */}
      <div className="navbar-home"></div>
      {/* Notifications */}
      <NotificationBell onOpenPostModal={handleOpenPostModal} />
      {/* User Dropdown */}
      <div className="user-dropdown" ref={dropdownRef}>
        <span className="welcome-text">Bienvenue, {userInfo.firstName} {userInfo.lastName}</span>
        <div className="dropdown">
          {/* Clickable Profile Picture */}
          <div className="user-avatar-container">
            <Link to={`/profile/view/${userId}`}>
              <img
                src={userInfo.profilePicture}
                alt={`${userInfo.firstName} ${userInfo.lastName}`}
                className="user-avatar"
              />
            </Link>
            <div onClick={toggleDropdown}>
              <lord-icon
                src="https://cdn.lordicon.com/xcrjfuzb.json"
                trigger="morph"
                state="hover-arrow-down-2"
                colors="primary:#88A2FF"
                style={{
                  width: '26px',
                  height: '26px',
                  position: 'absolute',
                  right: '0',
                  bottom: '0',
                  marginBottom: '10px',
                  marginRight: '-30px',
                  cursor: 'pointer'
                }}
              ></lord-icon>
            </div>
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
      <SinglePostModal
        isOpen={isPostModalOpen}
        onClose={handleClosePostModal}
        postId={modalPostId}
        userId={userId}
        isAuthenticated={!!user}
        token={user?.token}
      />
    </nav>
  );
}

export default Navbar;
