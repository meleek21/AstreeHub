import React, { useEffect, useState } from 'react';
import { eventsAPI } from '../services/apiServices';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBirthdayCake, faGift } from '@fortawesome/free-solid-svg-icons';
import UserBadge from './UserBadge';
import Confetti from 'react-confetti';
import '../assets/Css/ClosestBirthdays.css';

const ClosestBirthdays = () => {
  const [birthdays, setBirthdays] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [celebratingId, setCelebratingId] = useState(null);
  const [dimensions, setDimensions] = useState({ 
    width: window.innerWidth, 
    height: window.innerHeight 
  });

  useEffect(() => {
    const fetchClosestBirthdays = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await eventsAPI.GetClosestBirthdays();
        setBirthdays(response.data);
      } catch (err) {
        setError('Failed to fetch birthdays');
      } finally {
        setLoading(false);
      }
    };
    fetchClosestBirthdays();

    const handleResize = () => {
      setDimensions({
        width: window.innerWidth,
        height: window.innerHeight
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (loading) return (
    <div className="closest-birthdays-loading">
      <div className="loading-spinner"></div>
      <p>Chargement des anniversaires...</p>
    </div>
  );
  
  if (error) return (
    <div className="closest-birthdays-error">
      <FontAwesomeIcon icon={faBirthdayCake} className="error-icon" />
      <p>{error}</p>
    </div>
  );
  
  if (!birthdays.length) return (
    <div className="closest-birthdays-empty">
      <FontAwesomeIcon icon={faGift} className="empty-icon" />
      <p>Aucun anniversaire à venir trouvé.</p>
    </div>
  );

  return (
    <div className="closest-birthdays-container">
      {celebratingId && (
        <Confetti
          width={dimensions.width}
          height={dimensions.height}
          recycle={false}
          numberOfPieces={500}
          gravity={0.2}
          onConfettiComplete={() => setCelebratingId(null)}
        />
      )}

      <h3 className="closest-birthdays-title">
        <FontAwesomeIcon 
          icon={faBirthdayCake} 
          className="title-icon" 
        />
        <span className="title-text">Prochains Anniversaires</span>
        <span className="title-decoration"></span>
      </h3>
      
      <div className="closest-birthdays-scroll">
        {birthdays.map((b, idx) => (
          <div 
            className="birthday-card" 
            key={b.employeeId || idx}
            onMouseEnter={() => setCelebratingId(b.employeeId)}
            onMouseLeave={() => setCelebratingId(null)}
          >
            <div className="birthday-ribbon"></div>
            <div className="birthday-content">
              <div className="birthday-avatar-container">
                <UserBadge userId={b.employeeId} />
              </div>
              
              <div className="birthday-info">
                <div className="birthday-date">
                  {b.dateOfBirth ? new Date(b.dateOfBirth).toLocaleDateString('fr-FR', {
                    day: 'numeric', 
                    month: 'long'
                  }) : ''}
                </div>
                <div className="birthday-wish">
                  <span>🎉</span> Joyeux Anniversaire! <span>🎂</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ClosestBirthdays;