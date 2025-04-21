import React, { useEffect, useRef } from "react";
import { useState } from "react";
import { MentionsInput, Mention } from "react-mentions";
import { userAPI } from "../services/apiServices";
import toast from "react-hot-toast";
import '../assets/Css/MentionsInput.css';

const MentionInput = React.memo(({ content, setContent, isEditing }) => {
  const [users, setUsers] = useState([]);
  const mentionsInputRef = useRef(null);

  // Default profile picture URL
  const defaultProfilePicture = 'https://res.cloudinary.com/REMOVED/image/upload/frheqydmq3cexbfntd7e.jpg';

  // Fetch users for mentions
  useEffect(() => {
    let mounted = true;
    const fetchUsers = async () => {
      try {
        const response = await userAPI.getAllEmployees();
        if (mounted) setUsers(response.data);
      } catch (error) {
        if (mounted) toast.error('Failed to load user list');
      }
    };
    fetchUsers();
    return () => { mounted = false; };
  }, []);

  // Format user data for mentions
  const userMentionData = users.map(user => ({
    id: user.id,
    display: `${user.firstName} ${user.lastName}`,
    avatar: user.profilePictureUrl || defaultProfilePicture
  }));

  return (
    <MentionsInput
      ref={mentionsInputRef}
      value={content}
      onChange={e => setContent(e.target.value)}
      className="mentions-input"
      placeholder="Tapez @ pour mentionner quelqu'un.."
      autoFocus
      allowSuggestionsAboveCursor
      forceSuggestionsAboveCursor
    >
      <Mention
        trigger="@"
        data={userMentionData}
        markup="@[__display__](user:__id__)"
        displayTransform={(id, display) => `@${display}`}
        appendSpaceOnAdd={true}
        renderSuggestion={suggestion => (
          <div className="user-suggestion">
            <img 
              src={suggestion.avatar || 'https://via.placeholder.com/40'} 
              alt={suggestion.display}
              className="mention-avatar"
              onError={e => { e.target.src = 'https://via.placeholder.com/40'; }}
              style={{ width: 32, height: 32, borderRadius: '50%', marginRight: 8, objectFit: 'cover', background: '#f0f0f0' }}
            />
            <span>{suggestion.display}</span>
          </div>
        )}
      />
    </MentionsInput>
  );
});

export default MentionInput;