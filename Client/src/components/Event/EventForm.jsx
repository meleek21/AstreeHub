import React, { useState } from 'react';
import { format } from 'date-fns';
import { eventsAPI } from '../../services/apiServices';
import { useAuth } from '../../Context/AuthContext';
import { toast } from 'react-hot-toast';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTimes } from "@fortawesome/free-solid-svg-icons";
import '../../assets/Css/EventForm.css'
const EventForm = ({ selectedDate, onClose, onEventCreated }) => {
  const { user } = useAuth();
  const userId = user.id;
  const [isSubmitting, setIsSubmitting] = useState(false);

  const correspondanceCategorieType = {
    RéunionÉquipe: 'Réunion',
    RéunionDépartement: 'Réunion',
    RéunionClient: 'Réunion',
    EntretienIndividuel: 'Réunion',
    Atelier: 'Formation',
    Certification: 'Formation',
    Séminaire: 'Formation',
    Conférence: 'ÉvénementEntreprise',
    TeamBuilding: 'ÉvénementEntreprise',
    FêteEntreprise: 'ÉvénementEntreprise',
    Anniversaire: 'Personnel',
    AnniversaireTravail: 'Personnel',
    Absence: 'Personnel',
    MaintenanceSystème: 'Technique',
    Déploiement: 'Technique',
    Autre: 'Général',
    Urgence: 'Général',
  };

  const groupesCategories = {
    Réunion: ['RéunionÉquipe', 'RéunionDépartement', 'RéunionClient', 'EntretienIndividuel'],
    Formation: ['Atelier', 'Certification', 'Séminaire'],
    ÉvénementEntreprise: ['Conférence', 'TeamBuilding', 'FêteEntreprise'],
    Personnel: ['Anniversaire', 'AnniversaireTravail', 'Absence'],
    Technique: ['MaintenanceSystème', 'Déploiement'],
    Général: ['Autre', 'Urgence']
  };

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    eventDateTime: format(selectedDate, 'yyyy-MM-dd') + 'T10:00',
    endDateTime: format(selectedDate, 'yyyy-MM-dd') + 'T11:00',
    location: '',
    category: 'RéunionÉquipe',
    isOpenEvent: false,
    organizer: userId || '',
    isRecurring: false,
    associatedEmployeeId: userId
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      if (!formData.title || formData.title.length < 5 || formData.title.length > 100) {
        throw new Error('Le titre doit contenir entre 5 et 100 caractères');
      }
      if (!formData.description || formData.description.length > 500) {
        throw new Error('La description est obligatoire (500 caractères max)');
      }
      if (!formData.location || formData.location.length > 100) {
        throw new Error('Le lieu est obligatoire (100 caractères max)');
      }

      const dateDebut = new Date(formData.eventDateTime);
      const dateFin = new Date(formData.endDateTime);
      
      if (dateFin <= dateDebut) {
        throw new Error('La date de fin doit être après la date de début');
      }

      const donneesEvenement = {
        ...formData,
        type: correspondanceCategorieType[formData.category] || 'Général'
      };

      const response = await eventsAPI.createEvent(donneesEvenement);
      
      if (response.data) {
        toast.success('Événement créé avec succès');
        onEventCreated(response.data);
        onClose();
      }
    } catch (error) {
      console.error('Erreur:', error);
      toast.error(error.message || 'Erreur lors de la création');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  return (
    <div className="event-form">
      <div className="post-editor-header event-header">
        <h3>Créer un nouvel événement</h3>
        <FontAwesomeIcon
          icon={faTimes}
          className="close-icon"
          onClick={onClose}
        />
      </div>
      
      <form onSubmit={handleSubmit} className="event-create-form">
        <div className="form-group">
          <label>Titre <span className="required">*</span></label>
          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleChange}
            placeholder="Titre de l'événement (5-100 caractères)"
            required
            minLength="5"
            maxLength="100"
          />
        </div>

        <div className="form-group">
          <label>Description <span className="required">*</span></label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder="Description de l'événement (500 caractères max)"
            required
            maxLength="500"
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Date et heure de début <span className="required">*</span></label>
            <input
              type="datetime-local"
              name="eventDateTime"
              value={formData.eventDateTime}
              onChange={handleChange}
              required
            />
          </div>
          
          <div className="form-group">
            <label>Date et heure de fin <span className="required">*</span></label>
            <input
              type="datetime-local"
              name="endDateTime"
              value={formData.endDateTime}
              onChange={handleChange}
              required
            />
          </div>
        </div>

        <div className="form-group">
          <label>Lieu <span className="required">*</span></label>
          <input
            type="text"
            name="location"
            value={formData.location}
            onChange={handleChange}
            placeholder="Lieu de l'événement"
            required
            maxLength="100"
          />
        </div>

        <div className="form-group">
          <label>Catégorie</label>
          <select
            name="category"
            value={formData.category}
            onChange={handleChange}
          >
            {Object.entries(groupesCategories).map(([type, categories]) => (
              <optgroup label={type} key={type}>
                {categories.map(categorie => (
                  <option value={categorie} key={categorie}>
                    {categorie.replace(/([A-Z])/g, ' $1').trim()}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </div>

       
<div className="form-row">
  <label className="checkbox-container">
    Événement ouvert (sans RSVP)
    <input
      type="checkbox"
      name="isOpenEvent"
      checked={formData.isOpenEvent}
      onChange={handleChange}
    />
    <span className="checkmark"></span>
  </label>
  
  <label className="checkbox-container">
    Événement récurrent
    <input
      type="checkbox"
      name="isRecurring"
      checked={formData.isRecurring}
      onChange={handleChange}
    />
    <span className="checkmark"></span>
  </label>
</div>

        <div className="form-actions">
          <button 
            type="button" 
            onClick={onClose} 
            className="cancel-btn"
            disabled={isSubmitting}
          >
            Annuler
          </button>
          <button 
            type="submit" 
            className="create-btn"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                Création en cours
                <span className="loading-spinner"></span>
              </>
            ) : 'Créer'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default EventForm;