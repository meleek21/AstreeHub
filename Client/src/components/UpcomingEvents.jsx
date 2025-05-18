import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { eventsAPI } from '../services/apiServices';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCalendarAlt, faSpinner } from '@fortawesome/free-solid-svg-icons';
import { motion, AnimatePresence } from 'framer-motion';
import '../assets/Css/UpcomingEvents.css';

const UpcomingEvents = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  // Preserved your original typeColors
  const typeColors = {
    'Général': '#3788d8',
    'Réunion': '#2c3e50',
    'Formation': '#27ae60',
    'ÉvénementEntreprise': '#8e44ad',
    'Personnel': '#e67e22',
    'Anniversaire': '#e74c3c',
    'Technique': '#3498db'
  };

  useEffect(() => {
    const fetchUpcomingEvents = async () => {
      try {
        const response = await eventsAPI.getUpcomingEvents();
        setEvents(response.data);
      } catch (err) {
        setError('Échec du chargement des événements');
      } finally {
        setLoading(false);
      }
    };
    fetchUpcomingEvents();
  }, []);

  const formatEventDate = (dateString) => {
    const date = new Date(dateString);
    return {
      day: date.toLocaleDateString('fr-FR', { day: 'numeric' }),
      month: date.toLocaleDateString('fr-FR', { month: 'short' }),
      time: date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
    };
  };

  return (
    <motion.div 
      className="upcoming-events-container"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div className="upcoming-events-header">
        <FontAwesomeIcon 
          icon={faCalendarAlt} 
          className="title-icon"
        />
        <h3 className="upcoming-events-title">Événements à Venir</h3>
        <motion.button
          whileHover={{ rotate: 30 }}
          whileTap={{ scale: 0.9 }}
          className="refresh-button"
          onClick={() => {
            setLoading(true);
            setError(null);
            eventsAPI.getUpcomingEvents()
              .then(res => setEvents(res.data))
              .catch(err => setError('Échec du rafraîchissement'))
              .finally(() => setLoading(false));
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M4 12C4 16.4183 7.58172 20 12 20C16.4183 20 20 16.4183 20 12C20 7.58172 16.4183 4 12 4C9.536 4 7.332 5.114 5.864 6.864L4 5M4 12V3M4 12H13" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            />
          </svg>
        </motion.button>
      </div>

      <AnimatePresence>
        {loading ? (
          <motion.div
            className="upcoming-events-loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
            >
              <FontAwesomeIcon icon={faSpinner} />
            </motion.div>
            <p>Chargement des événements...</p>
          </motion.div>
        ) : error ? (
          <motion.div
            className="upcoming-events-error"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <FontAwesomeIcon icon={faCalendarAlt} className="error-icon" />
            <p>{error}</p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="retry-button"
              onClick={() => {
                setLoading(true);
                setError(null);
                eventsAPI.getUpcomingEvents()
                  .then(res => setEvents(res.data))
                  .catch(err => setError('Échec du chargement'))
                  .finally(() => setLoading(false));
              }}
            >
              Réessayer
            </motion.button>
          </motion.div>
        ) : events.length === 0 ? (
          <motion.div
            className="upcoming-events-empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <FontAwesomeIcon icon={faCalendarAlt} />
            <p>Aucun événement à venir</p>
          </motion.div>
        ) : (
          <motion.div 
            className="upcoming-events-scroll"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            {events.map((event, index) => {
              const formattedDate = formatEventDate(event.eventDateTime);
              return (
                <motion.div
                  key={event.id}
                  className="event-card"
                  onClick={() => navigate('/evenement', { state: { eventId: event.id } })}
                  style={{ 
                    borderLeft: `4px solid ${typeColors[event.type] || '#3788d8'}`,
                    borderTop: `2px solid ${typeColors[event.type] || '#3788d8'}33`,
                    cursor: 'pointer'
                  }}
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ y: -5, boxShadow: '0 6px 12px rgba(0,0,0,0.1)' }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="event-date-badge">
                    <span className="event-day">{formattedDate.day}</span>
                    <span className="event-month">{formattedDate.month}</span>
                  </div>
                  <div className="event-content">
                    <div className="event-details">
                      <h4>{event.title}</h4>
                      <div className="event-meta">
                        <span className="event-time">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                            <path d="M12 8V12L15 15M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" 
                              stroke="currentColor" 
                              strokeWidth="2" 
                              strokeLinecap="round" 
                              strokeLinejoin="round"
                            />
                          </svg>
                          {formattedDate.time}
                        </span>
                        <span className="event-location">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                            <path d="M17.6569 16.6569C16.7202 17.5935 14.7616 19.5521 13.4138 20.8999C12.6327 21.681 11.3677 21.6814 10.5866 20.9003C9.26234 19.576 7.34159 17.6553 6.34315 16.6569C3.21895 13.5327 3.21895 8.46734 6.34315 5.34315C9.46734 2.21895 14.5327 2.21895 17.6569 5.34315C20.781 8.46734 20.781 13.5327 17.6569 16.6569Z" 
                              stroke="currentColor" 
                              strokeWidth="2" 
                              strokeLinecap="round" 
                              strokeLinejoin="round"
                            />
                            <path d="M15 11C15 12.6569 13.6569 14 12 14C10.3431 14 9 12.6569 9 11C9 9.34315 10.3431 8 12 8C13.6569 8 15 9.34315 15 11Z" 
                              stroke="currentColor" 
                              strokeWidth="2" 
                              strokeLinecap="round" 
                              strokeLinejoin="round"
                            />
                          </svg>
                          {event.location}
                        </span>
                      </div>
                    </div>
                    <div 
                      className="event-type-badge"
                      style={{ backgroundColor: `${typeColors[event.type] || '#3788d8'}33` }}
                    >
                      {event.type}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default UpcomingEvents;