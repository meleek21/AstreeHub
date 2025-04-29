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
  
  const filteredParticipants = participants.filter(user => 
    `${user.firstName} ${user.lastName}`.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const modalRef = useRef(null);

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
      toast.error('Failed to load users');
    }
  };

  const handleUserSelect = (userId) => {
    setSelectedUsers(prev =>
      prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!groupName.trim() || selectedUsers.length < 2) {
      toast.error('Group name and at least 2 participants are required.');
      return;
    }
    setLoading(true);
    try {
      const payload = {
        Title: groupName,
        ParticipantIds: selectedUsers,
        UserId: currentUser.id
      };
      const response = await messagesAPI.createConversation(payload);
      toast.success('Group chat created!');
      onGroupCreated?.(response.data);
      onClose();
    } catch (error) {
      toast.error('Failed to create group chat');
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
            <h1>Create Group Chat</h1>
            <FontAwesomeIcon
              icon={faTimes}
              className="close-icon"
              onClick={onClose}
            />
          </div>
          
          <form onSubmit={handleSubmit} className="post-editor-textarea-container">
            <div className="form-group">
              <label>Group Name</label>
              <input
                type="text"
                value={groupName}
                onChange={e => setGroupName(e.target.value)}
                required
                placeholder="Enter group name"
              />
            </div>
            <div className="form-group">
              <label>Select Participants</label>
              <input
                type="text"
                placeholder="Search participants..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="search-input"
              />
              <div className="participants-list">
                {filteredParticipants.map(user => (
                  <label key={user.id} className="participant-item">
                    <input
                      type="checkbox"
                      checked={selectedUsers.includes(user.id)}
                      onChange={() => handleUserSelect(user.id)}
                      disabled={loading}
                    />
                    <UserBadge userId={user.id} />
                  </label>
                ))}
              </div>
            </div>
            
            <div className="post-editor-actions">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="delete-draft-button"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="submit-button"
              >
                {loading ? 'Creating...' : 'Create Group'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </ModalPortal>
  );
};

export default CreateGroupModal;