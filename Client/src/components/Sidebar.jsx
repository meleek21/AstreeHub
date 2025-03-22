import React from 'react';
import { Link, useLocation } from 'react-router-dom';

function Sidebar() {
  const location = useLocation();

  return (
    <aside className="sidebar">
      <ul className="sidebar-links">
        {/* First Group */}
        <li>
          <Link to="/channels" className={`sidebar-link ${location.pathname === '/channels' ? 'active' : ''}`}>
            <lord-icon
              src="https://cdn.lordicon.com/wxhtpnnk.json"
              trigger="hover"
              colors="primary:#0047AB"
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
              colors="primary:#0047AB"
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
              colors="primary:#0047AB"
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
              colors="primary:#0047AB"
              style={{ width: '30px', height: '30px' }}
            ></lord-icon>
            <span>Fil d'actualité</span>
          </Link>
        </li>
        <li>
          <Link to="/messages" className={`sidebar-link ${location.pathname === '/messages' ? 'active' : ''}`}>
            <lord-icon
              src="https://cdn.lordicon.com/ayhtotha.json"
              trigger="hover"
              colors="primary:#0047AB"
              style={{ width: '30px', height: '30px' }}
            ></lord-icon>
            <span>Messages</span>
          </Link>
        </li>

        {/* Second Group */}
        <li>
          <Link to="/creer-post" className={`sidebar-link ${location.pathname === '/creer-post' ? 'active' : ''}`}>
            <lord-icon
              src="https://cdn.lordicon.com/hqymfzvj.json"
              trigger="hover"
              colors="primary:#0047AB"
              style={{ width: '30px', height: '30px' }}
            ></lord-icon>
            <span>Nouvelle annonce?</span>
          </Link>
        </li>
      </ul>
    </aside>
  );
}

export default Sidebar;