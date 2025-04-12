import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faGlobe } from '@fortawesome/free-solid-svg-icons';

const InviteAllSection = ({ handleInviteAll, isSending }) => (
  <div className="invite-all-section mt-3">
    <p className="text-muted">This will send invitations to all employees in the company.</p>
    <button 
      className="btn btn-success" 
      onClick={handleInviteAll}
      disabled={isSending}
    >
      {isSending ? (
        <>
          <span className="spinner-border spinner-border-sm mr-2" role="status" aria-hidden="true" />
          Sending...
        </>
      ) : (
        <>
          <FontAwesomeIcon icon={faGlobe} className="mr-2" />
          Send to Everyone
        </>
      )}
    </button>
  </div>
);
export default InviteAllSection;