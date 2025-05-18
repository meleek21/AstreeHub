import React from 'react';
import '../assets/Css/EventSideBar.css';
import ClosestBirthdays from './ClosestBirthdays';
import { 
  FaCalendarAlt,        // Général
  FaUsers,              // Réunion
  FaGraduationCap,      // Formation
  FaBuilding,           // ÉvénementEntreprise
  FaUser,               // Personnel
  FaBirthdayCake,       // Anniversaire
  FaLaptopCode          // Technique
} from 'react-icons/fa';

const EventSideBar = ({ onCreateEvent }) => {
    
    const typeColors = {
        'Général': '#3788d8',
        'Réunion': '#2c3e50',
        'Formation': '#27ae60',
        'ÉvénementEntreprise': '#8e44ad',
        'Personnel': '#e67e22',
        'Anniversaire': '#e74c3c',
        'Technique': '#3498db'
    };

    const typeIcons = {
        'Général': <FaCalendarAlt size={14} />,
        'Réunion': <FaUsers size={14} />,
        'Formation': <FaGraduationCap size={14} />,
        'ÉvénementEntreprise': <FaBuilding size={14} />,
        'Personnel': <FaUser size={14} />,
        'Anniversaire': <FaBirthdayCake size={14} />,
        'Technique': <FaLaptopCode size={14} />
    };

    return (
        <div className="event-sidebar">
            {/* Create Event Button */}
            <button className="create-event-button" onClick={onCreateEvent}>
                Nouvel événement !
            </button>
            
            <ClosestBirthdays />
            
            {/* Color Legend with Icons */}
            <div className="color-legend">
                <h4>Légende des couleurs</h4>
                <ul className="legend-list">
                    {Object.entries(typeColors).map(([type, color]) => (
                        <li key={type} className="legend-item">
                            <span className="legend-icon">{typeIcons[type]}</span>
                            <span 
                                className="color-badge" 
                                style={{ backgroundColor: color }}
                            />
                            <span className="type-name">{type}</span>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
};

EventSideBar.defaultProps = {
    onSearchChange: () => {},
    onCreateEvent: () => {}
};

export default EventSideBar;