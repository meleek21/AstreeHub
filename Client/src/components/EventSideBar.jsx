import React, { useState } from 'react';
import MiniCalendar from './MiniCalendar';
import '../assets/Css/EventSideBar.css';
import ClosestBirthdays from './ClosestBirthdays';

const EventSideBar = ({ onSearchChange, onCreateEvent }) => {
    const [searchQuery, setSearchQuery] = useState('');

    return (
        <div className="event-sidebar">
            {/* Search Bar */}
            <div className="search-bar">
                <input
                    type="text"
                    placeholder="Search events..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
                <button className="search-button">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="11" cy="11" r="8"></circle>
                        <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                    </svg>
                </button>
            </div>

            {/* Create Event Button */}
            <button className="create-event-button" onClick={onCreateEvent}>
                Nouvel événement !
            </button>

            {/* Mini Calendar Component */}
            <MiniCalendar />
            <ClosestBirthdays />
        </div>
    );
};

EventSideBar.defaultProps = {
    onSearchChange: () => {},
    onCreateEvent: () => {}
};

export default EventSideBar;