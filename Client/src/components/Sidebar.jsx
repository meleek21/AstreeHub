import React from 'react';
import { Link, useLocation } from 'react-router-dom';

function Sidebar() {
  const location = useLocation();

  return (
    <aside className="sidebar">
      <ul className="sidebar-links">
        {/* First Group */}
         {/* Logo */}
      <li>
        <Link to="/" className="logo-link">Astree.net</Link>
      </li>

      {/* Home Link */}
      <li>
        <Link to="/" className="nav-link">
          <lord-icon
            src="https://cdn.lordicon.com/wmwqvixz.json"
            trigger="morph"
            colors="primary:#7697a0"
            style={{ width: '30px', height: '30px' }}
          ></lord-icon>
          <span>Acceuil</span>
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
            <span>Annonces</span>
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
            <span>Bibliothèque</span>
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
            <span>Événement</span>
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
            <span>Fil d'actualité</span>
          </Link>
        </li>
        <li>
          <Link to="/chat" className={`sidebar-link ${location.pathname === '/messages' ? 'active' : ''}`}>
            <lord-icon
              src="https://cdn.lordicon.com/ayhtotha.json"
              trigger="hover"
              colors="primary:#7697a0"
              style={{ width: '30px', height: '30px' }}
            ></lord-icon>
            <span>Messages</span>
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
            <span>Nouvelle annonce</span>
          </button>
        </li>
      </ul>
    </aside>
  );
}

export default Sidebar;