import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import astreeLogo from '../assets/astree.png';

function Sidebar({ onToggleCollapse }) {
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  const handleToggle = () => {
    setCollapsed((prev) => {
      const newState = !prev;
      if (onToggleCollapse) onToggleCollapse(newState);
      return newState;
    });
  };

  return (
    <aside className={`sidebar${collapsed ? ' collapsed' : ''}`}> 
      <button 
        className="sidebar-toggle" 
        onClick={handleToggle} 
        aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        <lord-icon
          src="https://cdn.lordicon.com/ternnbni.json"
          trigger="hover"
          colors="primary:#f4b69c"
          style={{
            width: '30px',
            height: '30px',
            transform: collapsed ? 'rotate(90deg)' : 'rotate(-90deg)',
            transition: 'transform 0.3s ease'
          }}
        ></lord-icon>
      </button>
      <ul className="sidebar-links">
        {/* Logo */}
        <li>
          <div className="sidebar-logo-container">
            <img src={astreeLogo} alt="Astree Logo" className="sidebar-logo" />
          </div>
        </li>
        {/* Home Link */}
        <li>
          <Link to="/home" className="nav-link">
            <lord-icon
              src="https://cdn.lordicon.com/wmwqvixz.json"
              trigger="morph"
              colors="primary:#7697a0"
              style={{ width: '30px', height: '30px' }}
            ></lord-icon>
            {!collapsed && <span>Acceuil</span>}
            {collapsed && <span className="sidebar-tooltip">Acceuil</span>}
          </Link>
        </li>
        <li>
          <Link to="/channels" className={`sidebar-link ${location.pathname === '/channels' ? 'active' : ''}`}> 
            <lord-icon
              src="https://cdn.lordicon.com/wxhtpnnk.json"
              trigger="hover"
              colors="primary:#7697a0"
              style={{ width: '30px', height: '30px' }}
            ></lord-icon>
            {!collapsed && <span>Annonces</span>}
            {collapsed && <span className="sidebar-tooltip">Annonces</span>}
          </Link>
        </li>
        <li>
          <Link to="/bibliotheque" className={`sidebar-link ${location.pathname === '/bibliotheque' ? 'active' : ''}`}> 
            <lord-icon
              src="https://cdn.lordicon.com/fkaukecx.json"
              trigger="hover"
              colors="primary:#7697a0"
              style={{ width: '30px', height: '30px' }}
            ></lord-icon>
            {!collapsed && <span>Bibliothèque</span>}
            {collapsed && <span className="sidebar-tooltip">Bibliothèque</span>}
          </Link>
        </li>
        <li>
          <Link to="/evenement" className={`sidebar-link ${location.pathname === '/evenement' ? 'active' : ''}`}> 
            <lord-icon
              src="https://cdn.lordicon.com/wmlleaaf.json"
              trigger="hover"
              colors="primary:#7697a0"
              style={{ width: '30px', height: '30px' }}
            ></lord-icon>
            {!collapsed && <span>Événement</span>}
            {collapsed && <span className="sidebar-tooltip">Événement</span>}
          </Link>
        </li>
        <li>
          <Link to="/feed" className={`sidebar-link ${location.pathname === '/feed' ? 'active' : ''}`}> 
            <lord-icon
              src="https://cdn.lordicon.com/eouimtlu.json"
              trigger="hover"
              colors="primary:#7697a0"
              style={{ width: '30px', height: '30px' }}
            ></lord-icon>
            {!collapsed && <span>Fil d'actualité</span>}
            {collapsed && <span className="sidebar-tooltip">Fil d'actualité</span>}
          </Link>
        </li>
        <li>
          <Link to="/messages" className={`sidebar-link ${location.pathname === '/messages' ? 'active' : ''}`}> 
            <lord-icon
              src="https://cdn.lordicon.com/ayhtotha.json"
              trigger="hover"
              colors="primary:#7697a0"
              style={{ width: '30px', height: '30px' }}
            ></lord-icon>
            {!collapsed && <span>Messages</span>}
            {collapsed && <span className="sidebar-tooltip">Messages</span>}
          </Link>
        </li>
        {/* New Post Button */}
        <li className="new-post-button">
          <button className="create-post-btn">
            <lord-icon
              src="https://cdn.lordicon.com/hqymfzvj.json"
              trigger="hover"
              colors="primary:#ffebd0ff"
              style={{ width: '30px', height: '30px' }}
            ></lord-icon>
            {!collapsed && <span>Nouvelle annonce</span>}
            {collapsed && <span className="sidebar-tooltip">Nouvelle annonce</span>}
          </button>
        </li>
      </ul>
    </aside>
  );
}

export default Sidebar;