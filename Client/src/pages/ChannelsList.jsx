import React, { useState, useEffect } from 'react';
import Channel from '../components/ChannelCard';
import { useAuth } from '../Context/AuthContext';
import { channelsAPI } from '../services/apiServices';
import '../assets/Css/Channel.css'; // Import your custom CSS file

function ChannelsList() {
  const [channels, setChannels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user } = useAuth();

  useEffect(() => {
    const fetchChannels = async () => {
      try {
        const response = await channelsAPI.getUserChannels(user?.departmentId);
        if (!response.data) {
          throw new Error('No data received from server');
        }
        const channelsData = Array.isArray(response.data) ? response.data : [];
        if (channelsData.length === 0) {
          setError('No channels available');
        }
        setChannels(channelsData);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching channels:', err);
        setError(err.response?.data?.message || 'Failed to load channels');
        setLoading(false);
      }
    };

    fetchChannels();
  }, [user?.departmentId]);

  if (loading) {
    return <div className="loading-container">Loading channels...</div>;
  }

  if (error) {
    return <div className="error-container">{error}</div>;
  }

  return (
    <div className="feed-container">
      <div className="channels-grid">
        {!Array.isArray(channels) || channels.length === 0 ? (
          <div className="no-channels">No channels available</div>
        ) : (
          channels.map((channel) => (
            <div className="channel-item" key={channel.id}>
              <Channel channel={channel} />
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default ChannelsList;