import React, { useState, useEffect } from 'react';
import { useRef } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes } from '@fortawesome/free-solid-svg-icons';
import ModalPortal from '../ModalPortal';
import { userAPI, messagesAPI } from '../../services/apiServices';
import UserBadge from '../UserBadge';
import toast from 'react-hot-toast';

const CreateGroupModal = ({ isOpen, onClose, currentUser, onGroupCreated }) => {
  const [groupName, setGroupName] = useState('');
  const [participants, setParticipants] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isFocused, setIsFocused] = useState({
    groupName: false,
    search: false
  });
  
  const filteredParticipants = participants.filter(user => 
    `${user.firstName} ${user.lastName}`.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const modalRef = useRef(null);
  const groupNameRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      // Focus on group name input when modal opens
      if (groupNameRef.current) {
        groupNameRef.current.focus();
      }
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  useEffect(() => {
    if (isOpen) {
      fetchUsers();
      setGroupName('');
      setSelectedUsers([]);
    }
  }, [isOpen]);

  const fetchUsers = async () => {
    try {
      const response = await userAPI.getAllEmployees();
      setParticipants(response.data.filter(u => u.id !== currentUser.id));
    } catch (error) {
      showErrorToast('Échec du chargement des utilisateurs. Veuillez réessayer.');
    }
  };

  const showErrorToast = (message) => {
    toast.error(message);
  };

  const showSuccessToast = (message) => {
    toast.success(message);
  };

  const handleUserSelect = (userId) => {
    setSelectedUsers(prev =>
      prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!groupName.trim()) {
      showErrorToast('Le nom du groupe est requis');
      return;
    }
    
    if (selectedUsers.length < 2) {
      showErrorToast('Veuillez sélectionner au moins 2 participants');
      return;
    }
    
    setLoading(true);
    try {
      const payload = {
        Title: groupName,
        ParticipantIds: [...selectedUsers, currentUser.id],
        CreatorId: currentUser.id,
        IsGroup: true
      };
      console.log(payload);
      const response = await messagesAPI.createConversation(payload);
      showSuccessToast('Groupe de discussion créé avec succès !');
      onGroupCreated?.(response.data);
      onClose();
    } catch (error) {
      showErrorToast(error.response?.data?.message || 'Échec de la création du groupe de discussion');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <ModalPortal>
      <div className="post-editor-overlay">
        <div className="post-editor-content" ref={modalRef}>
          <div className="post-editor-header">
            <h1>Créer un groupe de discussion</h1>
            <FontAwesomeIcon
              icon={faTimes}
              className="close-icon"
              onClick={onClose}
            />
          </div>
          
          <form onSubmit={handleSubmit} className="post-editor-textarea-container">
            <div className="form-group">
              <input
                ref={groupNameRef}
                type="text"
                value={groupName}
                onChange={e => setGroupName(e.target.value)}
                required
                className="form-control"
                placeholder='Nom du groupe'
              />
            </div>
            
            <div className="form-group">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="form-control search-input"
                placeholder='Rechercher des participants'
              />
            </div>
            
            <div className="participants-list">
              {filteredParticipants.length > 0 ? (
                filteredParticipants.map(user => (
                  <label key={user.id} className="participant-item">
                    <div className="user-badge-wrapper">
                      <input
                        type="checkbox"
                        checked={selectedUsers.includes(user.id)}
                        onChange={() => handleUserSelect(user.id)}
                        disabled={loading}
                      />
                      <UserBadge userId={user.id} />
                    </div>
                  </label>
                ))
              ) : (
                <div className="no-participants">
                  {searchQuery ? 'Aucun participant correspondant trouvé' : 'Chargement des participants...'}
                </div>
              )}
            </div>
            
            <div className="group-editor-actions">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="delete-draft-button"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={loading}
                className="submit-button"
              >
                {loading ? (
                  <>
                    <span className="loading-spinner"></span>
                    Création en cours...
                  </>
                ) : 'Créer le groupe'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </ModalPortal>
  );
};

export default CreateGroupModal;