import { useState, useEffect } from 'react';
import axios from 'axios';
import '../assets/Css/Reactions.css';

// Constants for reaction types
const reactionTypes = ['Like', 'Love', 'Haha', 'Wow', 'Sad', 'Angry'];

// Helper function to fetch reaction data
const fetchReactionData = async (postId, employeeId) => {
  const token = localStorage.getItem('token');
  const [summaryRes, reactionsRes, userRes] = await Promise.all([
    axios.get(`http://localhost:5126/api/reaction/post/${postId}/summary`, {
      headers: { Authorization: `Bearer ${token}` },
    }),
    axios.get(`http://localhost:5126/api/reaction/post/${postId}`, {
      headers: { Authorization: `Bearer ${token}` },
    }),
    axios.get(`http://localhost:5126/api/reaction/employee/${employeeId}/post/${postId}`, {
      headers: { Authorization: `Bearer ${token}` },
    }).catch(() => ({ data: null })) // Handle 404 for user reaction
  ]);
  return { summaryRes, reactionsRes, userRes };
};

// ReactionButton component
const ReactionButton = ({ type, count, isActive, onClick }) => (
  <button
    key={type}
    onClick={onClick}
    className={`reaction-button ${isActive ? 'active' : ''}`}
    aria-label={`React with ${type}`}
  >
    {type} ({count})
  </button>
);

// ReactedUsers component
const ReactedUsers = ({ users }) => (
  <div className="reacted-users">
    {users.map((reaction) => (
      <span key={reaction.id} className="user-reaction">
        {reaction.employeeId} ({reaction.type})
      </span>
    ))}
  </div>
);

// Main Reaction component
function Reaction({ postId, employeeId }) {
  const [reactionSummary, setReactionSummary] = useState({
    Total: 0,
    LikeCount: 0,
    LoveCount: 0,
    HahaCount: 0,
    WowCount: 0,
    SadCount: 0,
    AngryCount: 0
  });
  const [userReaction, setUserReaction] = useState(null);
  const [reactedUsers, setReactedUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadReactionData = async () => {
      try {
        const { summaryRes, reactionsRes, userRes } = await fetchReactionData(postId, employeeId);
        setReactionSummary(summaryRes.data);
        setReactedUsers(reactionsRes.data);
        setUserReaction(userRes?.data?.type || null);
      } catch (error) {
        setError('Failed to load reactions. Please try again later.');
        console.error('Error loading reactions', error);
      } finally {
        setLoading(false);
      }
    };

    loadReactionData();
  }, [postId, employeeId]);

  const handleReaction = async (type) => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        'http://localhost:5126/api/reaction',
        { postId, type, employeeId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      // Refresh reaction data after update
      const { summaryRes, reactionsRes, userRes } = await fetchReactionData(postId, employeeId);
      setReactionSummary(summaryRes.data);
      setReactedUsers(reactionsRes.data);
      setUserReaction(userRes?.data?.type || null);
    } catch (error) {
      setError('Failed to update reaction. Please try again.');
      console.error('Error updating reaction', error);
    }
  };

  if (loading) return <div className="loading">Loading reactions...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="reaction-container">
      <div className="reaction-buttons">
        {reactionTypes.map((type) => (
          <ReactionButton
            key={type}
            type={type}
            count={reactionSummary[`${type}Count`]}
            isActive={userReaction === type}
            onClick={() => handleReaction(type)}
          />
        ))}
      </div>
      
      <div className="reaction-details">
        <span>{reactionSummary.Total} Réactions</span>
        {reactedUsers.length > 0 && <ReactedUsers users={reactedUsers} />}
      </div>
    </div>
  );
}

export default Reaction;