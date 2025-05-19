import React, { useEffect, useState } from 'react';
import { eventsAPI, userAPI } from '../services/apiServices';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBirthdayCake, faGift } from '@fortawesome/free-solid-svg-icons';
import Confetti from 'react-confetti';
import '../assets/Css/ClosestBirthdays.css';

const defaultProfilePicture = 'https://res.cloudinary.com/REMOVED/image/upload/frheqydmq3cexbfntd7e.jpg';

const ClosestBirthdays = () => {
  const [birthdays, setBirthdays] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [celebratingId, setCelebratingId] = useState(null);
  const [dimensions, setDimensions] = useState({ 
    width: window.innerWidth, 
    height: window.innerHeight 
  });

  const fetchUserInfo = async (employeeId) => {
    try {
      const response = await userAPI.getUserInfo(employeeId);
      return {
        firstName: response.data.firstName,
        lastName: response.data.lastName,
        profilePicture: response.data.profilePictureUrl || defaultProfilePicture
      };
    } catch (error) {
      console.error('Error fetching user info:', error);
      return {
        firstName: '',
        lastName: '',
        profilePicture: defaultProfilePicture
      };
    }
  };

  useEffect(() => {
    const fetchClosestBirthdays = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await eventsAPI.GetClosestBirthdays();
        const birthdaysWithUserInfo = await Promise.all(
          response.data.map(async b => ({
            ...b,
            ...(await fetchUserInfo(b.employeeId))
          }))
        );
        setBirthdays(birthdaysWithUserInfo);
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
                <img
                  src={b.profilePicture || defaultProfilePicture}
                  alt={`${b.firstName} ${b.lastName}`}
                  className="birthday-avatar"
                />
                <div className='birthday-name'>
                  {b.firstName} {b.lastName}
                </div>
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