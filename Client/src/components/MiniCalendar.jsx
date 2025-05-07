import React, { useState, useEffect } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import '../assets/Css/MiniCalendar.css';
import { eventsAPI } from '../services/apiServices';

const MiniCalendar = () => {
    const [date, setDate] = useState(new Date());
    const [events, setEvents] = useState([]);
    const [birthdays, setBirthdays] = useState([]);

    const getEventTypeColor = (type) => {
        const typeColors = {
            'Général': '#3788d8',
            'Réunion': '#2c3e50',
            'Formation': '#27ae60',
            'ÉvénementEntreprise': '#8e44ad',
            'Personnel': '#e67e22',
            'Anniversaire': '#e74c3c',
            'Technique': '#3498db'
        };
        return typeColors[type] || typeColors['Général'];
    };

    useEffect(() => {
        const fetchEvents = async () => {
            try {
                const response = await eventsAPI.getAllEvents();
                setEvents(response.data);
            } catch (error) {
                console.error('Échec de récupérer les événements:', error);
            }
        };

        const fetchBirthdays = async () => {
            try {
                const response = await eventsAPI.GetTodaysBirthdays();
                setBirthdays(response.data);
            } catch (error) {
                console.error('Échec de récupérer les anniversaires:', error);
            }
        };

        fetchEvents();
        fetchBirthdays();
    }, []);

    const tileContent = ({ date, view }) => {
        if (view === 'month') {
            const dayEvents = [
                ...events.filter(event => new Date(event.eventDateTime).toDateString() === date.toDateString()),
                ...birthdays.filter(birthday => new Date(birthday.birthDate).toDateString() === date.toDateString())
            ];
            
            if (dayEvents.length > 0) {
                return (
                    <div className="event-dots">
                        {dayEvents.map((event, index) => (
                            <div 
                                key={index} 
                                className="event-dot" 
                                style={{
                                    backgroundColor: event.isBirthday ? '#ff7675' : getEventTypeColor(event.type)
                                }}
                            />
                        ))}
                    </div>
                );
            }
        }
        return null;
    };

    return (
        <div className="mini-calendar-container">
            <h3>{date.toLocaleString('fr-FR', { month: 'long' })} {date.getFullYear()}</h3>
            <Calendar
                onChange={setDate}
                value={date}
                view="month"
                tileContent={tileContent}
                navigationLabel={({ date }) => `${date.toLocaleString('fr-FR', { month: 'short' })} ${date.getFullYear()}`}
                formatShortWeekday={(locale, date) => ['S', 'M', 'T', 'W', 'T', 'F', 'S'][date.getDay()]}
            />
        </div>
    );
};

export default MiniCalendar;