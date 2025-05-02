import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { userAPI, messagesAPI } from '../services/apiServices';
import UserBadge from './UserBadge';
import useOnlineStatus from '../hooks/useOnlineStatus';
import '../assets/Css/UserList.css';

const UserList = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { isUserOnline } = useOnlineStatus();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        const response = await userAPI.getAllEmployees();
        setUsers(response.data || []);
        setError(null);
      } catch (err) {
        console.error('Error fetching users:', err);
        setError('Failed to load users.');
        setUsers([]);
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, []);

  const handleUserClick = async (user) => {
    try {
      // Get current user from localStorage or context
      const currentUser = JSON.parse(localStorage.getItem('user'));
      if (!currentUser || currentUser.id === user.id) return;
      // Fetch all conversations for current user
      const { data: conversations } = await messagesAPI.getUserConversations(currentUser.id);
      // Try to find a direct conversation with this user
      let conversation = conversations.find(
        (conv) =>
          !conv.isGroup &&
          conv.participants.length === 2 &&
          conv.participants.some((p) => p.id === user.id)
      );
      if (!conversation) {
        // Create new conversation
        const { data: newConv } = await messagesAPI.createConversation({
          participantIds: [currentUser.id, user.id],
          isGroup: false
        });
        conversation = newConv;
      }
      // Redirect to messages page with conversation id
      navigate(`/messages/${conversation.id}`);
    } catch (err) {
      console.error('Error opening/creating conversation:', err);
      alert('Could not open conversation.');
    }
  };

  const sortedUsers = [...users].sort((a, b) => {
    const isAOnline = isUserOnline(a.id);
    const isBOnline = isUserOnline(b.id);
    return isBOnline - isAOnline;
  });

  if (loading) {
    return <div>Loading users...</div>;
  }
  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div className={styles.userListContainer}>
      <h2 className={styles.userListTitle}>User List</h2>
      <div className={styles.userList}>
        {sortedUsers.length > 0 ? (
          sortedUsers.map((user) => (
            <div
              key={user.id}
              className={styles.userListItem}
              onClick={() => handleUserClick(user)}
              tabIndex={0}
              role="button"
              aria-label={`Open chat with ${user.firstName} ${user.lastName}`}
              onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') handleUserClick(user); }}
            >
              <div className="userBadge">
                <UserBadge userId={user.id} />
              </div>
            </div>
          ))
        ) : (
          <div>No users found.</div>
        )}
      </div>
    </div>
  );
};

export default UserList;