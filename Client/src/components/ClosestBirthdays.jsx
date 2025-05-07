import React, { useEffect, useState } from 'react';
import { eventsAPI } from '../services/apiServices';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBirthdayCake, faUser } from '@fortawesome/free-solid-svg-icons';
import '../assets/Css/ClosestBirthdays.css';
import UserBadge from './UserBadge';
const ClosestBirthdays = () => {
  const [birthdays, setBirthdays] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchClosestBirthdays = async () => {
      setLoading(true);
      setError(null);
      try {
        // You may need to adjust the endpoint name if your backend uses a different one
        const response = await eventsAPI.GetClosestBirthdays();
        console.log('GetClosestBirthdays',response.data);
        setBirthdays(response.data);
      } catch (err) {
        setError('Failed to fetch birthdays');
      } finally {
        setLoading(false);
      }
    };
    fetchClosestBirthdays();
  }, []);

  if (loading) return <div className="closest-birthdays-loading">Chargement des anniversaires...</div>;
  if (error) return <div className="closest-birthdays-error">{error}</div>;
  if (!birthdays.length) return <div className="closest-birthdays-empty">Aucun anniversaire à venir trouvé.</div>;

  return (
    <div className="closest-birthdays-container">
      <h3 className="closest-birthdays-title">
        <FontAwesomeIcon icon={faBirthdayCake} style={{ color: '#e74c3c', marginRight: 8 }} />
        Prochains Anniversaires
      </h3>
      <div className="closest-birthdays-scroll">
        {birthdays.map((b, idx) => (
          <div className="birthday-card" key={b.employeeId || idx}>
            
              
            
            <div className="birthday-info">
            <UserBadge userId={b.employeeId}/><br />
              <div className="birthday-date">{b.dateOfBirth ? new Date(b.dateOfBirth).toLocaleDateString('fr-FR', {day: 'numeric', month: 'long'}) : ''}</div>
              <div className="birthday-wish">🎉 Joyeux Anniversaire ! 🎂</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ClosestBirthdays;