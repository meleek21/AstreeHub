import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { debounce } from 'lodash';
import signalRService from '../services/signalRService';
import { reactionsAPI,userAPI } from '../services/apiServices';
import '../assets/Css/Reactions.css';

const reactionTypes = [
  { type: 'Jaime', icon: <lord-icon src="https://cdn.lordicon.com/jrvgxhep.json" trigger="morph" state="hover-up" colors="primary:#f24c00,secondary:#f4b69c" style={{ width: '50px', height: '50px' }} /> },
  { type: 'Bravo', icon: <lord-icon src="https://cdn.lordicon.com/hlpsxaub.json" trigger="morph" colors="primary:#f4b69c,secondary:#3a3347" style={{ width: '50px', height: '50px' }} /> },
  { type: 'Jadore', icon: <lord-icon src="https://cdn.lordicon.com/dqhmanhc.json" trigger="morph" state="morph-glitter" style={{ width: '50px', height: '50px' }} /> },
  { type: 'Youpi', icon: <lord-icon src="https://cdn.lordicon.com/mhnfcfpf.json" trigger="morph" colors="primary:#4bb3fd,secondary:#ffc738,tertiary:#f28ba8,quaternary:#f24c00" style={{ width: '50px', height: '50px' }} /> },
  { type: 'Brillant', icon: <lord-icon src="https://cdn.lordicon.com/edplgash.json" trigger="morph" style={{ width: '50px', height: '50px' }} /> },
];

const fetchReactionData = async (postId, employeeId) => {
  try {
    const [summaryRes, reactionsRes, userRes] = await Promise.all([
      reactionsAPI.getReactionsSummary(postId),
      reactionsAPI.getReactionsByPost(postId),
      reactionsAPI.getReactionByEmployeeAndPost(employeeId, postId).catch(() => ({ data: null })),
    ]);

    // Get unique employee IDs from reactions
    const employeeIds = [...new Set(reactionsRes.data.map(r => r.employeeId))];
    // Fetch user info for all employees who reacted
    const userInfoPromises = employeeIds.map(id => userAPI.getUserInfo(id));
    const userInfos = await Promise.all(userInfoPromises);

    // Create a map of employeeId to user info
    const userInfoMap = userInfos.reduce((map, userInfo) => {
      map[userInfo.data.employeeId] = userInfo.data;
      return map;
    }, {});

    return { 
      summaryRes, 
      reactionsRes, 
      userRes,
      userInfoMap 
    };
  } catch (error) {
    console.error('Error fetching reaction data:', error);
    throw error;
  }
};

const ensureNumericValue = (value) => {
  const numValue = Number(value);
  return !isNaN(numValue) ? numValue : 0;
};

const ReactionButton = ({ type, icon, count, isActive, onClick }) => (
  <button
    onClick={onClick}
    onKeyDown={(e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        onClick();
      }
    }}
    className={`reaction-button ${isActive ? 'active' : ''}`}
    aria-label={`React with ${type}`}
    tabIndex={0}
  >
    {icon} ({count})
  </button>
);

const ReactedUsers = ({ users, userInfoMap }) => (
  <div className="reacted-users">
    {users.map((reaction) => {
      const userInfo = userInfoMap[reaction.employeeId];
      const displayName = userInfo 
        ? `${userInfo.firstName} ${userInfo.lastName}`
        : `User ${reaction.employeeId}`; // Fallback to ID if user info is not available
      
      return (
        <span key={reaction.id} className="user-reaction">
          {displayName} ({reaction.type})
        </span>
      );
    })}
  </div>
);

function Reaction({ postId, employeeId }) {
  const [reactionSummary, setReactionSummary] = useState({
    Total: 0,
    JaimeCount: 0,
    JadoreCount: 0,
    BravoCount: 0,
    YoupiCount: 0,
    BrillantCount: 0,
  });
  const [userReaction, setUserReaction] = useState(null);
  const [reactedUsers, setReactedUsers] = useState([]);
  const [userInfoMap, setUserInfoMap] = useState({});  // New state for user info
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showPopover, setShowPopover] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    const refreshReactionData = async () => {
      try {
        const { summaryRes, reactionsRes, userRes, userInfoMap } = await fetchReactionData(postId, employeeId);
        // ... existing summary validation ...
        const validatedSummary = {
          Total: ensureNumericValue(summaryRes.data?.total || summaryRes.data?.Total),
          JaimeCount: ensureNumericValue(summaryRes.data?.JaimeCount || summaryRes.data?.JaimeCount),
          JadoreCount: ensureNumericValue(summaryRes.data?.hahaCount || summaryRes.data?.JadoreCount),
          BravoCount: ensureNumericValue(summaryRes.data?.wowCount || summaryRes.data?.BravoCount),
          YoupiCount: ensureNumericValue(summaryRes.data?.sadCount || summaryRes.data?.YoupiCount),
          BrillantCount: ensureNumericValue(summaryRes.data?.angryCount || summaryRes.data?.BrillantCount),
        };
        setReactionSummary(validatedSummary);
        setReactedUsers(reactionsRes.data || []);
        setUserReaction(userRes?.data?.type || null);
        setUserInfoMap(userInfoMap);
      } catch (error) {
        console.error('Error refreshing reactions', error);
      }
    };

    const debouncedRefresh = debounce(refreshReactionData, 300);

    const onNewReaction = (reaction) => {
      if (reaction.postId === postId) {
        debouncedRefresh();
      }
    };

    const onUpdatedReaction = (reaction) => {
      if (reaction.postId === postId) {
        debouncedRefresh();
      }
    };

    const onDeletedReaction = (reactionId) => {
      debouncedRefresh();
    };

    const onReactionSummary = (receivedPostId, summary) => {
      if (receivedPostId === postId) {
        const validatedSummary = {
          Total: ensureNumericValue(summary.total || summary.Total),
          JaimeCount: ensureNumericValue(summary.JaimeCount || summary.JaimeCount),
          JadoreCount: ensureNumericValue(summary.hahaCount || summary.JadoreCount),
          BravoCount: ensureNumericValue(summary.wowCount || summary.BravoCount),
          YoupiCount: ensureNumericValue(summary.sadCount || summary.YoupiCount),
          BrillantCount: ensureNumericValue(summary.angryCount || summary.BrillantCount),
        };
        setReactionSummary(validatedSummary);
        debouncedRefresh();
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
        const { summaryRes, reactionsRes, userRes, userInfoMap } = await fetchReactionData(postId, employeeId);
        const validatedSummary = {
          Total: ensureNumericValue(summaryRes.data?.total || summaryRes.data?.Total),
          JaimeCount: ensureNumericValue(summaryRes.data?.JaimeCount || summaryRes.data?.JaimeCount),
          JadoreCount: ensureNumericValue(summaryRes.data?.hahaCount || summaryRes.data?.JadoreCount),
          BravoCount: ensureNumericValue(summaryRes.data?.wowCount || summaryRes.data?.BravoCount),
          YoupiCount: ensureNumericValue(summaryRes.data?.sadCount || summaryRes.data?.YoupiCount),
          BrillantCount: ensureNumericValue(summaryRes.data?.angryCount || summaryRes.data?.BrillantCount),
        };
        setReactionSummary(validatedSummary);
        setReactedUsers(reactionsRes.data || []);
        setUserReaction(userRes?.data?.type || null);
        setUserInfoMap(userInfoMap);
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
        setReactionSummary((prev) => ({
          ...prev,
          [`${type}Count`]: Math.max(0, prev[`${type}Count`] - 1),
          Total: Math.max(0, prev.Total - 1),
        }));

        const userReactionObj = reactedUsers.find((r) => r.employeeId === employeeId && r.type === type);
        if (userReactionObj) {
          await reactionsAPI.deleteReaction(userReactionObj.id);
        }
      } else {
        if (prevReaction) {
          const prevReactionObj = reactedUsers.find((r) => r.employeeId === employeeId && r.type === prevReaction);
          if (prevReactionObj) {
            await reactionsAPI.deleteReaction(prevReactionObj.id);
          }
        }

        setReactionSummary((prev) => ({
          ...prev,
          [`${prevReaction}Count`]: prevReaction ? Math.max(0, prev[`${prevReaction}Count`] - 1) : prev[`${prevReaction}Count`],
          [`${type}Count`]: prev[`${type}Count`] + 1,
          Total: prevReaction ? prev.Total : prev.Total + 1,
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
        JaimeCount: ensureNumericValue(summaryRes.data?.JaimeCount || summaryRes.data?.JaimeCount),
        JadoreCount: ensureNumericValue(summaryRes.data?.hahaCount || summaryRes.data?.JadoreCount),
        BravoCount: ensureNumericValue(summaryRes.data?.wowCount || summaryRes.data?.BravoCount),
        YoupiCount: ensureNumericValue(summaryRes.data?.sadCount || summaryRes.data?.YoupiCount),
        BrillantCount: ensureNumericValue(summaryRes.data?.angryCount || summaryRes.data?.BrillantCount),
      };
      setReactionSummary(validatedSummary);
      setReactedUsers(reactionsRes.data || []);
      setUserReaction(userRes?.data?.type || null);
    }
  };

  if (loading) return <div className="loading">Loading reactions...</div>;
  if (error)
    return (
      <div className="error">
        {error}
        <button onClick={() => window.location.reload()}>Retry</button>
      </div>
    );
// Find the current reaction object based on userReaction
const currentReaction = reactionTypes.find(r => r.type === userReaction);

return (
  <div className="reaction-container">
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
          <ReactedUsers users={reactedUsers} userInfoMap={userInfoMap} />
        </div>
      )}
    </div>

    <div
      className="reaction-trigger"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <button className="reaction-trigger-button">
        {userReaction ? (
          <>
            {currentReaction?.icon}
          </>
        ) : (
          'Jaime'
        )}
      </button>
      <div className={`reaction-buttons ${isHovered ? 'visible' : ''}`}>
        {reactionTypes.map(({ type, icon }) => (
          <ReactionButton
            key={type}
            type={type}
            icon={icon}
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

Reaction.propTypes = {
  postId: PropTypes.string.isRequired,
  employeeId: PropTypes.string.isRequired,
};

export default Reaction;