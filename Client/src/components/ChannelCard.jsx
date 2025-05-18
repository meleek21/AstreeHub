import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import '../assets/Css/Channel.css'; 

function ChannelCard({ channel }) {
  const navigate = useNavigate();

  if (!channel || typeof channel !== 'object') {
    return null;
  }

 

  return (
    <motion.div
      className="channel-card-container"
      initial="initial"
      whileHover="hover"
    >
      <div className="channel-card">
        <div className="channel-card-body">
          <h4 className="channel-card-title">
            {channel.name || 'Canal sans nom'}
          </h4>
          <p className="channel-card-text">
            {channel.isGeneral ? (
              <span className="badge badge-primary">Général</span>
            ) : (
              <span className="badge badge-secondary">Département</span>
            )}
          </p>
            <button
              className="channel-card-button"
              onClick={() => navigate(`/channel/${channel.id}`)}
            >
              Voir le canal
            </button>
        </div>
      </div>
    </motion.div>
  );
}

export default ChannelCard;