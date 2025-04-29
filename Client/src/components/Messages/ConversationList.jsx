import React from 'react';
import { format } from 'date-fns';
import UserBadge from '../UserBadge';
import CreateGroupModal from './CreateGroupModal';
import { useState } from 'react';

const ConversationList = ({ conversations, unreadCount, currentUser, onSelectConversation, onGroupCreated }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  return (
    <div className="conversation-list">
      <div className="conversation-header" style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
        <h2>Messages {unreadCount > 0 && <span className="badge">{unreadCount}</span>}</h2>
        <button onClick={() => setIsModalOpen(true)} style={{marginLeft:8,padding:'4px 12px',borderRadius:4,background:'#2196F3',color:'#fff',border:'none',fontWeight:'bold',cursor:'pointer'}}>+ Group</button>
      </div>
      <div className="conversation-items">
        {conversations.map(conv => (
          <div 
            key={conv.id} 
            className={`conversation-item ${conv.unreadCount > 0 ? 'unread' : ''}`}
            onClick={() => onSelectConversation(conv)}
          >
            <div className="avatar">
              {conv.isGroup ? <span>👥</span> : null}
            </div>
            <div className="conversation-details">
              <div className="conversation-title">
                {conv.isGroup ? conv.title : <UserBadge userId={conv.participants.find(p => p.id !== currentUser.id)?.id} />}
              </div>
              <div className="conversation-preview" style={{ fontWeight: conv.unreadCount > 0 ? 'bolder' : 'normal' }}>
                {conv.lastMessage?.content.substring(0, 30)}...
              </div>
            </div>
            <div className="conversation-meta">
              <div className="time">
                {format(new Date(conv.updatedAt), 'HH:mm')}
              </div>
              {conv.unreadCount > 0 && (
                <div className="unread-dot" style={{ background: 'red', color: 'white', borderRadius: '50%', minWidth: 22, minHeight: 22, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: 13, marginLeft: 8 }}>
                  {conv.unreadCount}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
      <CreateGroupModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        currentUser={currentUser}
        onGroupCreated={onGroupCreated}
      />
    </div>
  );
};

export default ConversationList;