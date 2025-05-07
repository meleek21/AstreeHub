import React from 'react';
import { format } from 'date-fns';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faCalendarAlt, 
  faClock, 
  faMapMarkerAlt, 
  faUsers,
  faFileAlt,
  faSave,
  faTimes,
  faLayerGroup
} from '@fortawesome/free-solid-svg-icons';
import UserBadge from '../UserBadge';
import AttendeeManagement from '../Attendees/AttendeeManagement';

const EventDetailsEdit = ({ 
  event, 
  onClose, 
  onSave, 
  onFieldChange, 
  isSaving,
  getEventTypeLabel
}) => {
  return (
    <div className="post-editor-content event-details">
      <div className="post-editor-header event-header">
        <h3>
          <input
            type="text"
            name="title"
            value={event.title}
            onChange={onFieldChange}
            className="edit-title-input"
          />
        </h3>
        <FontAwesomeIcon
                  icon={faTimes}
                  className="close-icon"
                  onClick={onClose}
                />
      </div>
      
      <div className="event-category-badge">
        <div className="edit-badges">
          <select
            name="category"
            value={event.category}
            onChange={onFieldChange}
            className="edit-category-select"
          >
            {Object.entries({
              Réunion: ['RéunionÉquipe', 'RéunionDépartement', 'RéunionClient', 'EntretienIndividuel'],
              Formation: ['Atelier', 'Certification', 'Séminaire'],
              ÉvénementEntreprise: ['Conférence', 'TeamBuilding', 'FêteEntreprise'],
              Personnel: ['Anniversaire', 'AnniversaireTravail', 'Absence'],
              Technique: ['MaintenanceSystème', 'Déploiement'],
              Général: ['Autre', 'Urgence']
            }).map(([type, categories]) => (
              <optgroup label={type} key={type}>
                {categories.map(categorie => (
                  <option value={categorie} key={categorie}>
                    {categorie.replace(/([A-Z])/g, ' $1').trim()}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
          <div className="checkbox-container">
            <label>
              <input
                type="checkbox"
                name="isOpenEvent"
                checked={event.isOpenEvent}
                onChange={onFieldChange}
              />
              Événement ouvert
            </label>
          </div>
        </div>
      </div>
      
      <div className="event-meta">
        <div className="meta-item">
          <FontAwesomeIcon icon={faCalendarAlt} className="meta-icon" />
          <div>
            <div className="meta-label">Date</div>
            <input
              type="date"
              name="eventDateTime"
              value={format(new Date(event.eventDateTime), 'yyyy-MM-dd')}
              onChange={onFieldChange}
              className="edit-date-input"
            />
          </div>
        </div>
        
        <div className="meta-item">
          <FontAwesomeIcon icon={faLayerGroup} className="meta-icon" />
          <div>
            <div className="meta-label">Type d'événement</div>
            <select
              name="type"
              value={event.type || 'Général'}
              onChange={onFieldChange}
              className="edit-type-select"
            >
              <option value="Général">Général</option>
              <option value="Réunion">Réunion</option>
              <option value="Formation">Formation</option>
              <option value="ÉvénementEntreprise">Événement d'entreprise</option>
              <option value="Personnel">Personnel</option>
              <option value="Technique">Technique</option>
            </select>
          </div>
        </div>
        
        <div className="meta-item">
          <FontAwesomeIcon icon={faClock} className="meta-icon" />
          <div>
            <div className="meta-label">Heure</div>
            <div className="time-edit-container">
              <input
                type="time"
                name="eventDateTime"
                value={format(new Date(event.eventDateTime), 'HH:mm')}
                onChange={onFieldChange}
                className="edit-time-input"
              />
              <span>to</span>
              <input
                type="time"
                name="endDateTime"
                value={format(new Date(event.endDateTime), 'HH:mm')}
                onChange={onFieldChange}
                className="edit-time-input"
              />
            </div>
          </div>
        </div>
        
        <div className="meta-item">
          <FontAwesomeIcon icon={faMapMarkerAlt} className="meta-icon" />
          <div>
            <div className="meta-label">Location</div>
            <input
              type="text"
              name="location"
              value={event.location}
              onChange={onFieldChange}
              className="edit-location-input"
            />
          </div>
        </div>
        
        <div className="meta-item">
          <FontAwesomeIcon icon={faUsers} className="meta-icon" />
          <div>
            <div className="meta-label">Organizer</div>
            <div><UserBadge userId={event.organizer}/>  {}</div>
          </div>
        </div>
      </div>
      
      <div className="event-description">
        <h3>
          <FontAwesomeIcon icon={faFileAlt} className="section-icon" />
          Description
        </h3>
        <textarea
          name="description"
          value={event.description}
          onChange={onFieldChange}
          className="edit-description-textarea"
        />
      </div>
      {!event.isOpenEvent && (
        <div className="attendee-management-section">
          <AttendeeManagement 
          event={event} 
          isEditing={true}
          isOrganizer={true} />
        </div>
      )}
      <div className="event-actions">
        <button 
          className="save-btn" 
          onClick={onSave}
          disabled={isSaving}
        >
          <FontAwesomeIcon icon={faSave} /> 
          {isSaving ? 'Enregistrement...' : 'Enregistrer'}
        </button>
        <button 
          className="cancel-btn" 
          onClick={onClose}
          disabled={isSaving}
        >
          <FontAwesomeIcon icon={faTimes} /> Annuler
        </button>
      </div>
    </div>
  );
};

export default EventDetailsEdit;