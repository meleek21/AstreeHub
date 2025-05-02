import React, { useState, useEffect } from 'react';
import TypingIndicator from './TypingIndicator';
import {messagesAPI, userAPI} from '../../../services/apiServices';
import ModalPortal from '../../ModalPortal';
import UserBadge from '../../UserBadge';
import ConfirmationModal from '../../ConfirmationModal';
import toast from 'react-hot-toast';

const ChatHeader = ({ 
  conversation, 
  currentUser, 
  typingUsers, 
  onSoftDeleteConversation,
  refreshConversations // Callback to refresh conversation list after changes
}) => {
  const [showGroupMenu, setShowGroupMenu] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [participants, setParticipants] = useState([]);
  const [isLoadingParticipants, setIsLoadingParticipants] = useState(false);
  const [allEmployees, setAllEmployees] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [loadingAdd, setLoadingAdd] = useState(false);
  const [isFocused, setIsFocused] = useState({ search: false });
  const [newParticipantId, setNewParticipantId] = useState('');
console.log('conversation', conversation);
  useEffect(() => {
    if (showGroupMenu && conversation?.isGroup) {
      fetchParticipants();
      fetchAllEmployees();
      setSearchQuery('');
      setSelectedUsers([]);
    }
  }, [showGroupMenu, conversation]);

  useEffect(() => {
    if (showGroupMenu && conversation?.isGroup) {
      fetchAllEmployees();
    }
  }, [showGroupMenu, conversation, participants]);

  const fetchParticipants = async () => {
    try {
      setIsLoadingParticipants(true);
      const response = await messagesAPI.getParticipants(conversation.id);
      setParticipants(response.data);
    } catch (error) {
      console.error('Échec de la récupération des participants :', error);
    } finally {
      setIsLoadingParticipants(false);
    }
  };

  const fetchAllEmployees = async () => {
    try {
      const response = await userAPI.getAllEmployees();
      setAllEmployees(response.data.filter(u => !participants.some(p => p === u.id)));
    } catch (error) {
      toast.error('Échec du chargement des utilisateurs.');
    }
  };

  const filteredEmployees = allEmployees.filter(user =>
    `${user.firstName} ${user.lastName}`.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleUserSelect = (userId) => {
    setSelectedUsers(prev =>
      prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
    );
  };

  const handleAddParticipants = async () => {
    if (selectedUsers.length === 0) {
      toast.error('Veuillez sélectionner au moins un utilisateur à ajouter.');
      return;
    }
    setLoadingAdd(true);
    try {
      for (const userId of selectedUsers) {
        await messagesAPI.addParticipant(conversation.id, currentUser.id, userId);
      }
      setSelectedUsers([]);
      setSearchQuery('');
      fetchParticipants();
      fetchAllEmployees();
      toast.success('Participants ajoutés avec succès !');
    } catch (error) {
      toast.error("Échec de l'ajout des participants.");
    } finally {
      setLoadingAdd(false);
    }
  };
  const handleDeleteGroup = async () => {
    setShowDeleteConfirm(true);
  };

  const handleLeaveGroup = async () => {
    try {
      await messagesAPI.leaveGroup(conversation.id, currentUser.id);
      refreshConversations();
    } catch (error) {
      console.error('Échec de la sortie du groupe :', error);
    }
  };

  const handleAddParticipant = async () => {
    if (!newParticipantId.trim()) return;
    
    try {
      await messagesAPI.addParticipant(conversation.id, currentUser.id, newParticipantId);
      setNewParticipantId('');
      fetchParticipants(); // Refresh participants list
    } catch (error) {
      console.error("Échec de l'ajout du participant :", error);
    }
  };
console.log( currentUser.id=== conversation.creatorId);
console.log( conversation.creatorId);
console.log( currentUser.id);
  return (
    <div className="chat-header">
      <ConfirmationModal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={async () => {
          setShowDeleteConfirm(false);
          if (!conversation || !currentUser) return;
          try {
            await messagesAPI.permanentlyDeleteGroup(conversation.id, currentUser.id);
            refreshConversations();
          } catch (error) {
            console.error('Échec de la suppression du groupe :', error);
          }
        }}
        title="Supprimer le groupe"
        message="Êtes-vous sûr de vouloir supprimer définitivement ce groupe ?"
      />
      <div className="header-content">
        <div className="conversation-info">
          <h3>{conversation.isGroup ? conversation.title : 
            conversation.participants.find(p => p.id !== currentUser.id)?.name}
          </h3>
          <TypingIndicator typingUsers={typingUsers} />
        </div>
        
        <div className="header-actions">
          {conversation.isGroup && (
            <div className="group-menu-container">
              <button
                className="icon-button group-menu-btn"
                onClick={() => setShowGroupMenu(prev => !prev)}
                title="Options du groupe"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <circle cx="5" cy="12" r="2"/>
                  <circle cx="12" cy="12" r="2"/>
                  <circle cx="19" cy="12" r="2"/>
                </svg>
              </button>
              {showGroupMenu && (
                <ModalPortal>
                  <div className="group-sidebar-overlay" onClick={() => setShowGroupMenu(false)}>
                    <div className="group-sidebar" onClick={e => e.stopPropagation()}>
                      <div className="group-menu-header">
                        <h4>{conversation.title}</h4>
                        <p>{participants.length} membres</p>
                      </div>
                      <div className="group-members-list">
                        {isLoadingParticipants ? (
                          <div className="loading-members">Chargement des membres...</div>
                        ) : (
                          participants.map((participant, idx) => {
                            let key = participant;
                            const isCreator = participant === conversation.CreatorId;
                            return (
                              <div key={key} className="group-member">
                                <div className="user-badge-wrapper">
                                  <UserBadge userId={participant} />
                                  {isCreator && (
                                    <span className="admin-badge">Admin</span>
                                  )}
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>
                      <div className="group-menu-section">
                        <h5>Ajouter de nouveaux membres</h5>
                        <div className={`form-group floating-label ${searchQuery || isFocused.search ? 'has-value' : ''}`}> 
                          <input
                            type="text"
                            placeholder=" "
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            onFocus={() => setIsFocused(prev => ({...prev, search: true}))}
                            onBlur={() => setIsFocused(prev => ({...prev, search: false}))}
                            className="floating-input search-input"
                          />
                          <label className="floating-label-text">Rechercher des employés</label>
                          <span className="floating-label-highlight"></span>
                        </div>
                        <div className="participants-list">
                          {filteredEmployees.length > 0 ? (
                            filteredEmployees.map(user => (
                              <label key={user.id} className="participant-item">
                                <div className="user-badge-wrapper">
                                  <input
                                    type="checkbox"
                                    checked={selectedUsers.includes(user.id)}
                                    onChange={() => handleUserSelect(user.id)}
                                    disabled={loadingAdd}
                                  />
                                  <UserBadge userId={user.id} />
                                </div>
                              </label>
                            ))
                          ) : (
                            <div className="no-participants">
                              {searchQuery ? 'Aucun employé correspondant trouvé' : 'Aucun employé disponible'}
                            </div>
                          )}
                        </div>
                        <div className="group-editor-actions">
                          <button
                            type="button"
                            onClick={handleAddParticipants}
                            disabled={loadingAdd}
                            className="submit-button"
                          >
                            {loadingAdd ? (
                              <>
                                <span className="loading-spinner"></span>
                                Ajout en cours...
                              </>
                            ) : 'Ajouter'}
                          </button>
                        </div>
                      </div>
                      <div className="group-menu-section danger-zone">
                        <button className="danger-btn" onClick={handleLeaveGroup}>
                        <lord-icon
    src="https://cdn.lordicon.com/spjdafms.json"
    trigger="click"
    colors="primary:#a41623,secondary:#a41623,tertiary:#a41623,quaternary:#a41623"
    style={{width:'30px',height:'30px'}}>
</lord-icon>
                          Quitter le groupe</button>
                        {conversation.isGroup && currentUser.id=== conversation.creatorId && (
                          <button className="delete-group-btn" onClick={handleDeleteGroup}>
                            Supprimer le groupe
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </ModalPortal>
              )}
            </div>
          )}
          
          <button
            className="icon-button delete-conversation-btn"
            onClick={() => onSoftDeleteConversation(conversation.id, currentUser.id)}
            title="Supprimer la conversation"
          >
            <lord-icon
              src="https://cdn.lordicon.com/wpyrrmcq.json"
              trigger="click"
              state="morph-trash-full"
              colors="primary:#c71f16"
              style={{width:'30px',height:'30px'}}>
            </lord-icon>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatHeader;