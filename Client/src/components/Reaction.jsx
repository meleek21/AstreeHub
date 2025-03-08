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
  // Convert to number and check if it's a valid number
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

  // Set up SignalR event handlers
  useEffect(() => {
    // Function to refresh reaction data
    const refreshReactionData = async () => {
      try {
        console.log('Refreshing reaction data for post:', postId);
        const { summaryRes, reactionsRes, userRes } = await fetchReactionData(postId, employeeId);
        
        // Log the raw data to debug
        console.log('Raw summary data:', summaryRes.data);
        
        // Ensure we have valid numeric values for all counts
        const validatedSummary = {
          Total: ensureNumericValue(summaryRes.data?.total || summaryRes.data?.Total),
          LikeCount: ensureNumericValue(summaryRes.data?.likeCount || summaryRes.data?.LikeCount),
          LoveCount: ensureNumericValue(summaryRes.data?.loveCount || summaryRes.data?.LoveCount),
          HahaCount: ensureNumericValue(summaryRes.data?.hahaCount || summaryRes.data?.HahaCount),
          WowCount: ensureNumericValue(summaryRes.data?.wowCount || summaryRes.data?.WowCount),
          SadCount: ensureNumericValue(summaryRes.data?.sadCount || summaryRes.data?.SadCount),
          AngryCount: ensureNumericValue(summaryRes.data?.angryCount || summaryRes.data?.AngryCount)
        };
        
        console.log('Updated reaction summary:', validatedSummary);
        setReactionSummary(validatedSummary);
        setReactedUsers(reactionsRes.data || []);
        setUserReaction(userRes?.data?.type || null);
      } catch (error) {
        console.error('Error refreshing reactions', error);
      }
    };

    // Set up event handlers for reaction events
    const onNewReaction = (reaction) => {
      if (reaction.postId === postId) {
        console.log('New reaction received for this post:', reaction);
        // Force immediate refresh instead of waiting for the next render cycle
        setTimeout(() => refreshReactionData(), 0);
      }
    };

    const onUpdatedReaction = (reaction) => {
      if (reaction.postId === postId) {
        console.log('Updated reaction received for this post:', reaction);
        // Force immediate refresh instead of waiting for the next render cycle
        setTimeout(() => refreshReactionData(), 0);
      }
    };

    const onDeletedReaction = (reactionId) => {
      console.log('Deleted reaction received:', reactionId);
      // Force immediate refresh instead of waiting for the next render cycle
      setTimeout(() => refreshReactionData(), 0);
    };
    
    // Handle reaction summary updates
    const onReactionSummary = (receivedPostId, summary) => {
      if (receivedPostId === postId) {
        console.log('Received reaction summary update for post', receivedPostId, ':', summary);
        const validatedSummary = {
          Total: ensureNumericValue(summary.total || summary.Total),
          LikeCount: ensureNumericValue(summary.likeCount || summary.LikeCount),
          LoveCount: ensureNumericValue(summary.loveCount || summary.LoveCount),
          HahaCount: ensureNumericValue(summary.hahaCount || summary.HahaCount),
          WowCount: ensureNumericValue(summary.wowCount || summary.WowCount),
          SadCount: ensureNumericValue(summary.sadCount || summary.SadCount),
          AngryCount: ensureNumericValue(summary.angryCount || summary.AngryCount)
        };
        console.log('Setting new reaction summary:', validatedSummary);
        setReactionSummary(validatedSummary);
        
        // Also refresh the full data to ensure consistency
        setTimeout(() => refreshReactionData(), 100);
      }
    };

    // Register event handlers
    signalRService.onNewReaction(onNewReaction);
    signalRService.onUpdatedReaction(onUpdatedReaction);
    signalRService.onDeletedReaction(onDeletedReaction);
    signalRService.onReactionSummary(onReactionSummary);

    // Clean up event handlers on unmount
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
        
        // Log the raw data to debug
        console.log('Raw summary data:', summaryRes.data);
        
        // Ensure we have valid numeric values for all counts
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
      // Optimistically update UI before server responds
      const isTogglingOff = userReaction === type;
      
      // Update local state immediately for better UX
      if (isTogglingOff) {
        // If clicking the same reaction, remove it
        setUserReaction(null);
        // Decrement the count for this reaction type
        setReactionSummary(prev => ({
          ...prev,
          [`${type}Count`]: Math.max(0, ensureNumericValue(prev[`${type}Count`]) - 1),
          Total: Math.max(0, ensureNumericValue(prev.Total) - 1)
        }));
      } else {
        // If user had a previous reaction, decrement that one
        if (userReaction) {
          setReactionSummary(prev => ({
            ...prev,
            [`${userReaction}Count`]: Math.max(0, ensureNumericValue(prev[`${userReaction}Count`]) - 1)
          }));
        } else {
          // If no previous reaction, increment total
          setReactionSummary(prev => ({
            ...prev,
            Total: ensureNumericValue(prev.Total) + 1
          }));
        }
        
        // Set the new reaction
        setUserReaction(type);
        // Increment the count for this reaction type
        setReactionSummary(prev => ({
          ...prev,
          [`${type}Count`]: ensureNumericValue(prev[`${type}Count`]) + 1
        }));
      }
      
      // Send request to server using the reactionsAPI service
      await reactionsAPI.addReaction({ postId, type, employeeId });
      
      // SignalR will handle subsequent updates, but we'll fetch as a fallback
      console.log('Reaction sent to server, waiting for SignalR update');
    } catch (error) {
      setError('Failed to update reaction. Please try again.');
      console.error('Error updating reaction', error);
      
      // Revert optimistic update on error
      const { summaryRes, reactionsRes, userRes } = await fetchReactionData(postId, employeeId);
      
      // Log the raw data to debug
      console.log('Raw summary data:', summaryRes.data);
      
      // Ensure we have valid numeric values when reverting
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
      <div className="reaction-buttons">
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
      
      <div className="reaction-details">
        <span>{ensureNumericValue(reactionSummary.Total)} Réactions</span>
        {reactedUsers.length > 0 && <ReactedUsers users={reactedUsers} />}
      </div>
    </div>
  );
}

export default Reaction;