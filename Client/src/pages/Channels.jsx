import React, { useState, useEffect } from 'react';
import Channel from '../components/Channel';
import { useAuth } from '../Context/AuthContext';
import { channelsAPI } from '../services/apiServices';
import { CRow, CCol } from '@coreui/react';

function Channels() {
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
  }, []);

  if (loading) {
    return <div className="loading-container">Loading channels...</div>;
  }

  if (error) {
    return <div className="error-container">{error}</div>;
  }

  return (
    <div className="feed-container">
      <CRow>
        {!Array.isArray(channels) || channels.length === 0 ? (
          <CCol>
            <div className="no-posts">No channels available</div>
          </CCol>
        ) : (
          channels.map((channel) => (
            <CCol sm={6} lg={4} key={channel.id}>
              <Channel channel={channel} />
            </CCol>
          ))
        )}
      </CRow>
    </div>
  );
}

export default Channels;