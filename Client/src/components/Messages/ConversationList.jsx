import React, { useState, useEffect, useRef } from 'react';
import { format } from 'date-fns';
import CreateGroupModal from './CreateGroupModal';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUsers, faPlus } from '@fortawesome/free-solid-svg-icons';
import { motion, AnimatePresence } from 'framer-motion';
import { userAPI, userOnlineStatusAPI } from '../../services/apiServices';
import '../../assets/Css/ConversationList.css';
import useOnlineStatus from '../../hooks/useOnlineStatus';
import UserList from '../UserList';

const ConversationList = ({ conversations, unreadCount, currentUser, onSelectConversation, onGroupCreated }) => {
  const { isUserOnline } = useOnlineStatus();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [userAvatars, setUserAvatars] = useState({});
  const [lastSeenTimes, setLastSeenTimes] = useState({});
  const [activeConversationId, setActiveConversationId] = useState(null);
  const modalRef = useRef();
  const defaultProfilePicture = 'https://res.cloudinary.com/REMOVED/image/upload/frheqydmq3cexbfntd7e.jpg';

  // Fetch avatars and last seen times
  useEffect(() => {
    const fetchUserData = async () => {
      const avatarMap = {};
      const lastSeenMap = {};
      const uniqueUserIds = new Set();

      // Collect all unique user IDs from conversations
      conversations.forEach(conv => {
        if (!conv.isGroup) {
          const otherUser = conv.participants.find(p => p.id !== currentUser.id);
          if (otherUser && !userAvatars[otherUser.id]) {
            uniqueUserIds.add(otherUser.id);
          }
        }
      });

      if (uniqueUserIds.size === 0) return;

      // Fetch avatars and last seen times in parallel
      const userDataPromises = Array.from(uniqueUserIds).map(async userId => {
        try {
          const [avatarResponse, lastSeenResponse] = await Promise.all([
            userAPI.getUserInfo(userId),
            userOnlineStatusAPI.getLastSeen(userId)
          ]);
          
          return {
            userId,
            avatar: avatarResponse.data.profilePictureUrl || defaultProfilePicture,
            lastSeen: lastSeenResponse.data
          };
        } catch (error) {
          console.error('Erreur lors de la récupération des données utilisateur :', error);
          return {
            userId,
            avatar: defaultProfilePicture,
            lastSeen: 'Hors ligne'
          };
        }
      });

      const results = await Promise.all(userDataPromises);
      
      results.forEach(({ userId, avatar, lastSeen }) => {
        avatarMap[userId] = avatar;
        if (!isUserOnline(userId)) {
          lastSeenMap[userId] = lastSeen;
        }
      });

      setUserAvatars(prev => ({ ...prev, ...avatarMap }));
      setLastSeenTimes(prev => ({ ...prev, ...lastSeenMap }));
    };

    fetchUserData();
  }, [conversations, currentUser.id, isUserOnline]);

  // Update last seen times when online status changes
  useEffect(() => {
    const updateLastSeenTimes = async () => {
      const updatedLastSeenTimes = { ...lastSeenTimes };
      let needsUpdate = false;

      for (const userId in updatedLastSeenTimes) {
        if (isUserOnline(userId)) {
          delete updatedLastSeenTimes[userId];
          needsUpdate = true;
        }
      }

      if (needsUpdate) {
        setLastSeenTimes(updatedLastSeenTimes);
      }
    };

    updateLastSeenTimes();
  }, [isUserOnline]);

  const filteredConversations = conversations.filter(conv => {
    if (!searchQuery) return true;
    
    const searchStr = searchQuery.toLowerCase();
    if (conv.isGroup) {
      return conv.title.toLowerCase().includes(searchStr);
    } else {
      const otherUser = conv.participants.find(p => p.id !== currentUser.id);
      return otherUser?.name.toLowerCase().includes(searchStr);
    }
  });

  // Click handling removed as CreateGroupModal now handles its own click events

  const getFormattedLastSeen = (userId) => {
    return lastSeenTimes[userId] || 'Hors ligne';
  };

  return (
    <div className="conversation-list">
      <div className="conversation-header">
        <h2>
          Messages 
          {unreadCount > 0 && <span className="badge">{unreadCount}</span>}
        </h2>
        <motion.button 
          className="new-group-btn"
          onClick={() => setIsModalOpen(true)}
          aria-label="Créer un nouveau groupe"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <FontAwesomeIcon icon={faPlus} />
          <span>Nouveau groupe</span>
        </motion.button>
      </div>

      <div className="conversation-search">
        <input
          type="text"
          placeholder="Rechercher des conversations..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <div className="conversation-items">
        {filteredConversations.length > 0 ? (
          filteredConversations.map(conv => {
            const otherUser = conv.participants.find(p => p.id !== currentUser.id);
            const isOnline = otherUser ? isUserOnline(otherUser.id) : false;
            
            return (
              <motion.div 
                key={conv.id} 
                className={`conversation-item ${conv.unreadCount > 0 ? 'unread' : ''} ${activeConversationId === conv.id ? 'active' : ''}`}
                onClick={() => {
                  setActiveConversationId(conv.id);
                  onSelectConversation(conv);
                }}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                whileHover={{ backgroundColor: 'var(--primary-lighter)' }}
              >
                <div className="avatar-container">
                  {conv.isGroup ? (
                    <div className="group-avatar">
                      <FontAwesomeIcon icon={faUsers} />
                    </div>
                  ) : (
                    <div className="user-avatar-wrapper">
  <div className="conv-user-avatar">
    <img 
      src={userAvatars[otherUser?.id] || defaultProfilePicture} 
      alt={`Profil de ${otherUser?.name}`} 
      onError={(e) => {
        e.target.onerror = null;
        e.target.src = defaultProfilePicture;
      }}
    />
    {isOnline ? (
      <div className="status-indicator online"></div>
    ) : (
      <div className="last-seen-pill">
        {getFormattedLastSeen(otherUser?.id)}
      </div>
    )}
  </div>
</div>

                  )}
                </div>
                
                <div className="conversation-details">
  <div className="conversation-title">
    {conv.isGroup ? conv.title : otherUser?.name}
  </div>
  <div className="conversation-preview">
    {conv.lastMessage?.content?.substring(0, 50) || 'Aucun message pour le moment'}
    {conv.lastMessage?.content?.length > 50 && '...'}
  </div>
</div>
                
                <div className="conversation-meta">
                  <div className="time">
                    {format(new Date(conv.updatedAt), 'h:mm a')}
                  </div>
                  {conv.unreadCount > 0 && (
                    <motion.div 
                      className="unread-count"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                    >
                      {conv.unreadCount}
                    </motion.div>
                  )}
                </div>
              </motion.div>
            );
          })
        ) : (
          <motion.div 
            className="empty-state"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            {searchQuery ? (
              <p>Aucune conversation trouvée pour "{searchQuery}"</p>
            ) : (
              <>
                <p>Aucune conversation pour le moment. Commencez une nouvelle discussion !</p>
                <UserList />
              </>
            )}
          </motion.div>
        )}
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <motion.div 
            className="modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div ref={modalRef}>
              <CreateGroupModal 
                isOpen={isModalOpen} 
                onClose={() => setIsModalOpen(false)} 
                currentUser={currentUser}
                onGroupCreated={onGroupCreated}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ConversationList;