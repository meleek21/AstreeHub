import { useState, useEffect } from 'react';
import signalRService from '../services/signalRService';
import { reactionsAPI } from '../services/apiServices';
import '../assets/Css/Reactions.css';

// Constants for reaction types
const reactionTypes = ['Like', 'Love', 'Haha', 'Wow', 'Sad', 'Angry'];

// Helper function to fetch reaction data
const fetchReactionData = async (postId, employeeId) => {
  try {
    const [summaryRes, reactionsRes, userRes] = await Promise.all([
      reactionsAPI.getReactionsSummary(postId),
      reactionsAPI.getReactionsByPost(postId),
      reactionsAPI.getReactionByEmployeeAndPost(employeeId, postId).catch(() => ({ data: null })) // Handle 404 for user reaction
    ]);
    return { summaryRes, reactionsRes, userRes };
  } catch (error) {
    console.error('Error fetching reaction data:', error);
    throw error;
  }
};

// Helper function to ensure numeric values for reaction counts
const ensureNumericValue = (value) => {
  const numValue = Number(value);
  return !isNaN(numValue) ? numValue : 0;
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
  const [showPopover, setShowPopover] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  // Set up SignalR event handlers
  useEffect(() => {
    const refreshReactionData = async () => {
      try {
        const { summaryRes, reactionsRes, userRes } = await fetchReactionData(postId, employeeId);
        const validatedSummary = {
          Total: ensureNumericValue(summaryRes.data?.total || summaryRes.data?.Total),
          LikeCount: ensureNumericValue(summaryRes.data?.likeCount || summaryRes.data?.LikeCount),
          LoveCount: ensureNumericValue(summaryRes.data?.loveCount || summaryRes.data?.LoveCount),
          HahaCount: ensureNumericValue(summaryRes.data?.hahaCount || summaryRes.data?.HahaCount),
          WowCount: ensureNumericValue(summaryRes.data?.wowCount || summaryRes.data?.WowCount),
          SadCount: ensureNumericValue(summaryRes.data?.sadCount || summaryRes.data?.SadCount),
          AngryCount: ensureNumericValue(summaryRes.data?.angryCount || summaryRes.data?.AngryCount)
        };
        setReactionSummary(validatedSummary);
        setReactedUsers(reactionsRes.data || []);
        setUserReaction(userRes?.data?.type || null);
      } catch (error) {
        console.error('Error refreshing reactions', error);
      }
    };

    const onNewReaction = (reaction) => {
      if (reaction.postId === postId) {
        setTimeout(() => refreshReactionData(), 0);
      }
    };

    const onUpdatedReaction = (reaction) => {
      if (reaction.postId === postId) {
        setTimeout(() => refreshReactionData(), 0);
      }
    };

    const onDeletedReaction = (reactionId) => {
      setTimeout(() => refreshReactionData(), 0);
    };

    const onReactionSummary = (receivedPostId, summary) => {
      if (receivedPostId === postId) {
        const validatedSummary = {
          Total: ensureNumericValue(summary.total || summary.Total),
          LikeCount: ensureNumericValue(summary.likeCount || summary.LikeCount),
          LoveCount: ensureNumericValue(summary.loveCount || summary.LoveCount),
          HahaCount: ensureNumericValue(summary.hahaCount || summary.HahaCount),
          WowCount: ensureNumericValue(summary.wowCount || summary.WowCount),
          SadCount: ensureNumericValue(summary.sadCount || summary.SadCount),
          AngryCount: ensureNumericValue(summary.angryCount || summary.AngryCount)
        };
        setReactionSummary(validatedSummary);
        setTimeout(() => refreshReactionData(), 100);
      }
    };

    signalRService.onNewReaction(onNewReaction);
    signalRService.onUpdatedReaction(onUpdatedReaction);
    signalRService.onDeletedReaction(onDeletedReaction);
    signalRService.onReactionSummary(onReactionSummary);

    return () => {
      signalRService.onNewReaction(null);
      signalRService.onUpdatedReaction(null);
      signalRService.onDeletedReaction(null);
      signalRService.onReactionSummary(null);
    };
  }, [postId, employeeId]);

  useEffect(() => {
    const loadReactionData = async () => {
      try {
        const { summaryRes, reactionsRes, userRes } = await fetchReactionData(postId, employeeId);
        const validatedSummary = {
          Total: ensureNumericValue(summaryRes.data?.total || summaryRes.data?.Total),
          LikeCount: ensureNumericValue(summaryRes.data?.likeCount || summaryRes.data?.LikeCount),
          LoveCount: ensureNumericValue(summaryRes.data?.loveCount || summaryRes.data?.LoveCount),
          HahaCount: ensureNumericValue(summaryRes.data?.hahaCount || summaryRes.data?.HahaCount),
          WowCount: ensureNumericValue(summaryRes.data?.wowCount || summaryRes.data?.WowCount),
          SadCount: ensureNumericValue(summaryRes.data?.sadCount || summaryRes.data?.SadCount),
          AngryCount: ensureNumericValue(summaryRes.data?.angryCount || summaryRes.data?.AngryCount)
        };
        setReactionSummary(validatedSummary);
        setReactedUsers(reactionsRes.data || []);
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
      const isTogglingOff = userReaction === type;
      const prevReaction = userReaction;
      const prevSummary = { ...reactionSummary };

      if (isTogglingOff) {
        setUserReaction(null);
        setReactionSummary(prev => ({
          ...prev,
          [`${type}Count`]: Math.max(0, prev[`${type}Count`] - 1),
          Total: Math.max(0, prev.Total - 1)
        }));

        const userReactionObj = reactedUsers.find(r => r.employeeId === employeeId && r.type === type);
        if (userReactionObj) {
          await reactionsAPI.deleteReaction(userReactionObj.id);
        }
      } else {
        if (prevReaction) {
          const prevReactionObj = reactedUsers.find(r => r.employeeId === employeeId && r.type === prevReaction);
          if (prevReactionObj) {
            await reactionsAPI.deleteReaction(prevReactionObj.id);
          }
        }

        setReactionSummary(prev => ({
          ...prev,
          [`${prevReaction}Count`]: prevReaction ? Math.max(0, prev[`${prevReaction}Count`] - 1) : prev[`${prevReaction}Count`],
          [`${type}Count`]: prev[`${type}Count`] + 1,
          Total: prevReaction ? prev.Total : prev.Total + 1
        }));
        setUserReaction(type);
        await reactionsAPI.addReaction({ postId, type, employeeId });
      }
    } catch (error) {
      setError('Failed to update reaction. Please try again.');
      console.error('Error updating reaction:', error);
      const { summaryRes, reactionsRes, userRes } = await fetchReactionData(postId, employeeId);
      const validatedSummary = {
        Total: ensureNumericValue(summaryRes.data?.total || summaryRes.data?.Total),
        LikeCount: ensureNumericValue(summaryRes.data?.likeCount || summaryRes.data?.LikeCount),
        LoveCount: ensureNumericValue(summaryRes.data?.loveCount || summaryRes.data?.LoveCount),
        HahaCount: ensureNumericValue(summaryRes.data?.hahaCount || summaryRes.data?.HahaCount),
        WowCount: ensureNumericValue(summaryRes.data?.wowCount || summaryRes.data?.WowCount),
        SadCount: ensureNumericValue(summaryRes.data?.sadCount || summaryRes.data?.SadCount),
        AngryCount: ensureNumericValue(summaryRes.data?.angryCount || summaryRes.data?.AngryCount)
      };
      setReactionSummary(validatedSummary);
      setReactedUsers(reactionsRes.data || []);
      setUserReaction(userRes?.data?.type || null);
    }
  };

  if (loading) return <div className="loading">Loading reactions...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="reaction-container">
      {/* Reaction Count on Top */}
      <div className="reaction-count-container">
        <span
          className="reaction-total"
          onClick={() => setShowPopover(!showPopover)}
          onMouseEnter={() => setShowPopover(true)}
          onMouseLeave={() => setShowPopover(false)}
        >
          {ensureNumericValue(reactionSummary.Total)} Réactions
        </span>
        {showPopover && reactedUsers.length > 0 && (
          <div className={`reaction-details-popover ${showPopover ? 'visible' : ''}`}>
            <ReactedUsers users={reactedUsers} />
          </div>
        )}
      </div>
  
      {/* Reaction Button */}
      <div
        className="reaction-trigger"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <button className="reaction-trigger-button">
          {userReaction ? `Reacted with ${userReaction}` : 'Like' }
        </button>
        <div className={`reaction-buttons ${isHovered ? 'visible' : ''}`}>
          {reactionTypes.map((type) => (
            <ReactionButton
              key={type}
              type={type}
              count={ensureNumericValue(reactionSummary[`${type}Count`])}
              isActive={userReaction === type}
              onClick={() => handleReaction(type)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export default Reaction;