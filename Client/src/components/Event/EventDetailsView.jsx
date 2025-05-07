import React from 'react';
import { format, formatDistanceToNow } from 'date-fns';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faCalendarAlt, 
  faClock, 
  faMapMarkerAlt, 
  faUsers,
  faFileAlt,
  faBirthdayCake,
  faTag,
  faEdit,
  faTrashAlt,
  faLayerGroup,
  faTimes,
  faInfoCircle,
  faGift,
  faUser,
  faPhone
} from '@fortawesome/free-solid-svg-icons';
import { faGoogle } from '@fortawesome/free-brands-svg-icons';
import AttendeeManagement from '../Attendees/AttendeeManagement';
import AttendeeItem from '../Attendees/AttendeeItem';
import toast from 'react-hot-toast';
import UserBadge from '../UserBadge';
import { eventsAPI } from '../../services/apiServices';

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

// Fonction utilitaire pour obtenir l'icône et la couleur selon le type d'événement
const getEventTypeIconAndColor = (type) => {
  switch (type) {
    case 'Général':
      return { icon: faInfoCircle, color: '#ffff' };
    case 'Réunion':
      return { icon: faCalendarAlt, color: '#ffff' };
    case 'Formation':
      return { icon: faLayerGroup, color: '#ffff' };
    case 'ÉvénementEntreprise':
      return { icon: faUsers, color: '#ffff' };
    case 'Personnel':
      return { icon: faUser, color: '#ffff' };
    case 'Anniversaire':
      return { icon: faGift, color: '#ffff' };
    case 'Technique':
      return { icon: faPhone, color: '#ffff' };
    default:
      return { icon: faTag, color: '#ffff' };
  }
};

const EventDetailsView = ({ 
  event, 
  onClose, 
  isOrganizer, 
  user, 
  onEditToggle, 
  onDelete, 
  addToGoogleCalendar,
  getEventTypeLabel,
  userAttendanceStatus,
  getAttendeeStatus,
  getAttendeeIsFinal,
  onUpdate
}) => {
  const startDate = new Date(event.eventDateTime);
  const endDate = event.endDateTime ? new Date(event.endDateTime) : new Date(startDate.getTime() + 60 * 60 * 1000);

  return (
    <div className="post-editor-content event-details">
      <div className="post-editor-header event-header">
        <h3>{event.title}</h3>
        <FontAwesomeIcon
                  icon={faTimes}
                  className="close-icon"
                  onClick={onClose}
                />
        
      </div>
      
      <div className="event-category-badge">
  <div className="event-badges">
    <span className={`category ${event.category.toLowerCase().replace(' ', '-')}`}>
      {event.category}
            {event.category === 'Anniversaire' && <FontAwesomeIcon icon={faBirthdayCake} className="ml-2" />}
    </span>
    {event.category !== 'Anniversaire' && (
      <span 
        className={`type-badge type-${(event.type || 'Général').toLowerCase()}`} 
        style={{ 
          backgroundColor: getEventTypeColor(event.type), 
          display: 'flex', 
          alignItems: 'center', 
          gap: '4px' 
        }}
      >
        {(() => { 
          const { icon, color } = getEventTypeIconAndColor(event.type || 'Général'); 
          return <FontAwesomeIcon icon={icon} style={{ color, marginRight: 4 }} />; 
        })()}
        {getEventTypeLabel(event.type || 'Général')}
      </span>
    )}
    {event.isOpenEvent && <span className="open-event-badge">Événement ouvert</span>}
  </div>
</div>
      
      <div className="event-meta">
        <div className="meta-item">
          <FontAwesomeIcon icon={faCalendarAlt} className="meta-icon" />
          <div>
            <div className="meta-label">Date</div>
            <div>{format(startDate, 'EEEE, MMMM do yyyy')}</div>
          </div>
        </div>
        
        <div className="meta-item">
          <FontAwesomeIcon icon={faLayerGroup} className="meta-icon" />
          <div>
            <div className="meta-label">Type d'événement</div>
            <div>{getEventTypeLabel(event.type || 'Général')}</div>
          </div>
        </div>
        
        <div className="meta-item">
          <FontAwesomeIcon icon={faClock} className="meta-icon" />
          <div>
            <div className="meta-label">Heure</div>
            <div>
              {format(startDate, 'h:mm a')} - {format(endDate, 'h:mm a')}
              <span className="duration">({formatDistanceToNow(endDate, { start: startDate })})</span>
            </div>
          </div>
        </div>
        
        <div className="meta-item">
          <FontAwesomeIcon icon={faMapMarkerAlt} className="meta-icon" />
          <div>
            <div className="meta-label">Lieu</div>
            <div>{event.location || 'Not specified'}</div>
          </div>
        </div>
        
        {event.organizer !=='System' && (
  <div className="meta-item">
    <FontAwesomeIcon icon={faUsers} className="meta-icon" />
    <div>
      <div className="meta-label">Organisateur</div>
      <div>
        <UserBadge userId={event.organizer} />
      </div>
    </div>
  </div>
)}
      </div>
      
      <div className="event-description">
        <h3>
          <FontAwesomeIcon icon={faFileAlt} className="section-icon" />
          Description
        </h3>
        <p>{event.description || 'No description provided.'}</p>
      </div>

      {/* Show AttendeeItem for invited non-organizer users */}
      {!isOrganizer && event.attendees && event.attendees.includes(user.id) && !event.isOpenEvent && (
        <div className="invitation-actions">
          <AttendeeItem
            attendeeId={user.id}
            isOrganizer={false}
            isEditing={false}
            user={user}
            status={getAttendeeStatus(user.id)}
            isFinal={getAttendeeIsFinal(user.id)}
            handleStatusChange={async (newStatus) => {
              try {
                await eventsAPI.updateAttendanceStatus(event.id, user.id, newStatus);
                if (typeof onUpdate === 'function') onUpdate();
                toast.success(`Invitation ${newStatus.toLowerCase() === 'Accepté' ? 'Accepté' : 'Refusé'}`);
              } catch (error) {
                toast.error('Failed to update invitation status');
              }
            }}
            handleRemoveAttendee={() => {}}
            event={event}
          />
        </div>
      )}
{event.organizer !=='System' && (
      <AttendeeManagement 
        event={event} 
        isOrganizer={isOrganizer} 
        onUpdate={onUpdate}
        isEditing={false}
      />)}
      
      <div className="event-actions">
        <button className="google-calendar-btn" onClick={addToGoogleCalendar}>
        <lord-icon
    src="https://cdn.lordicon.com/eziplgef.json"
    trigger="click"
    state="hover-draw"
    style={{width:'30px',height:'30px'}}>
</lord-icon>
           Ajouter à Google Calendar
        </button>
        
        {isOrganizer && (
          <>
            <button className="edit-btn" onClick={onEditToggle}>
              <FontAwesomeIcon icon={faEdit} /> Modifier l'événement
            </button>
            
            <button 
              className="delete-btn" 
              onClick={onDelete}
            >
              <FontAwesomeIcon icon={faTrashAlt} /> Supprimer l'événement
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default EventDetailsView;