import React from 'react';
import { useNavigate } from 'react-router-dom';
import { CButton, CCard, CCardBody, CCardText, CCardTitle } from '@coreui/react';

function Channel({ channel }) {
  const navigate = useNavigate();

  if (!channel || typeof channel !== 'object') {
    return null;
  }

  return (
    <CCard className="mb-3">
      <CCardBody>
        <CCardTitle>{channel.name || 'Unnamed Channel'}</CCardTitle>
        <CCardText>
          {channel.isGeneral ? (
            <span className="badge bg-primary">General</span>
          ) : (
            <span className="badge bg-secondary">Department</span>
          )}
        </CCardText>
        <CButton 
          color="primary" 
          onClick={() => navigate(`/channel/${channel.id}`)}
        >
          View Channel
        </CButton>
      </CCardBody>
    </CCard>
  );
}

export default Channel;