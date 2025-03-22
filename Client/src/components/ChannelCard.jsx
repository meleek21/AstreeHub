import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import '../assets/Css/Channel.css'; 

function ChannelCard({ channel }) {
  const navigate = useNavigate();

  if (!channel || typeof channel !== 'object') {
    return null;
  }

  // Animation variants for the card
  const cardVariants = {
    hover: {
      scale: 1.05,
      boxShadow: '0 8px 16px rgba(75, 100, 117, 0.7)',
      transition: {
        duration: 0.3,
        ease: 'easeInOut',
      },
    },
    initial: {
      scale: 1,
      boxShadow: '0 4px 6px rgba(75, 100, 117, 0.562)',
    },
  };

  return (
    <motion.div
      className="channel-card-container"
      variants={cardVariants}
      initial="initial"
      whileHover="hover"
    >
      <div className="channel-card">
        <div className="channel-card-body">
          <h4 className="channel-card-title">
            {channel.name || 'Unnamed Channel'}
          </h4>
          <p className="channel-card-text">
            {channel.isGeneral ? (
              <span className="badge badge-primary">General</span>
            ) : (
              <span className="badge badge-secondary">Department</span>
            )}
          </p>
            <button
              className="channel-card-button"
              onClick={() => navigate(`/channel/${channel.id}`)}
            >
              View Channel
            </button>
        </div>
      </div>
    </motion.div>
  );
}

export default ChannelCard;