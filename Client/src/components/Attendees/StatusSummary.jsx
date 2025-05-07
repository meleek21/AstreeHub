import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheck, faTimes, faQuestion } from '@fortawesome/free-solid-svg-icons';

const StatusSummary = ({ statusCounts }) => (
  <div className="status-summary">
    <div className="status-badge accepted">
      <FontAwesomeIcon icon={faCheck} />
      <span>{statusCounts.Accepté} Accepté</span>
    </div>
    <div className="status-badge declined">
      <FontAwesomeIcon icon={faTimes} />
      <span>{statusCounts.Refusé} Refusé</span>
    </div>
    <div className="status-badge pending">
      <FontAwesomeIcon icon={faQuestion} />
      <span>{statusCounts.EnAttente} En Attente</span>
    </div>
  </div>
);
export default StatusSummary;