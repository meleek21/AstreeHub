import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { reactionsAPI, userAPI } from '../../services/apiServices';
import ReactionSummary from './ReactionSummary';
import ReactionTrigger from './ReactionTrigger';


const ensureNumericValue = (value) => {
  const numValue = Number(value);
  return !isNaN(numValue) ? numValue : 0;
};

const fetchReactionData = async (postId, employeeId) => {
  try {
    const [summaryRes, reactionsRes, userRes] = await Promise.all([
      reactionsAPI.getReactionsSummary(postId),
      reactionsAPI.getReactionsByPost(postId),
      reactionsAPI.getReactionByEmployeeAndPost(employeeId, postId).catch(() => ({ data: null })),
    ]);

    if (Array.isArray(reactionsRes.data)) {
      const employeeIds = [...new Set(reactionsRes.data.map(r => r.employeeId))];
      const userInfoPromises = employeeIds.map(id => userAPI.getUserInfo(id));
      const userInfos = await Promise.all(userInfoPromises);

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
    } else {
      console.error('Expected an array but received:', reactionsRes.data);
      return { summaryRes, reactionsRes: { data: [] }, userRes, userInfoMap: {} };
    }
  } catch (error) {
    console.error('Error fetching reaction data:', error);
    throw error;
  }
};

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
  const [userInfoMap, setUserInfoMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    const loadReactionData = async () => {
      try {
        const { summaryRes, reactionsRes, userRes, userInfoMap } = await fetchReactionData(postId, employeeId);
        const validatedSummary = {
          Total: ensureNumericValue(summaryRes.data?.total || summaryRes.data?.Total),
          JaimeCount: ensureNumericValue(summaryRes.data?.jaimeCount || summaryRes.data?.JaimeCount),
          JadoreCount: ensureNumericValue(summaryRes.data?.jadoreCount || summaryRes.data?.JadoreCount),
          BravoCount: ensureNumericValue(summaryRes.data?.bravoCount || summaryRes.data?.BravoCount),
          YoupiCount: ensureNumericValue(summaryRes.data?.youpiCount || summaryRes.data?.YoupiCount),
          BrillantCount: ensureNumericValue(summaryRes.data?.brillantCount || summaryRes.data?.BrillantCount),
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
  if (error) return (
    <div className="error">
      {error}
      <button onClick={() => window.location.reload()}>Retry</button>
    </div>
  );

  return (
    <div className="reaction-container">
      <ReactionSummary 
        total={reactionSummary.Total} 
        reactedUsers={reactedUsers} 
        userInfoMap={userInfoMap}
      />
      
      <ReactionTrigger
        isHovered={isHovered}
        setIsHovered={setIsHovered}
        userReaction={userReaction}
        reactionSummary={reactionSummary}
        handleReaction={handleReaction}
      />
    </div>
  );
}

Reaction.propTypes = {
  postId: PropTypes.string.isRequired,
  employeeId: PropTypes.string.isRequired,
};

export default Reaction;