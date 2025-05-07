import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faGlobe } from '@fortawesome/free-solid-svg-icons';
import AttendeeItem from '../Attendees/AttendeeItem';

const InviteAllSection = ({ employees = [], handleInviteAll, isSending }) => (
  <div className="invite-all-section mt-3">
    <p className="text-muted">Cela enverra des invitations à tous les employés de l'entreprise.</p>
    <div className="all-employee-list mt-3">
      {employees.length === 0 ? (
        <div>Aucun employé trouvé.</div>
      ) : (
        employees.map(emp => (
          <AttendeeItem
            key={emp.id}
            attendeeId={emp.id}
            isOrganizer={false}
            isEditing={false}
            user={emp}
            userAttendanceStatus={{status: 'En attente', isFinal: false}}
            handleStatusChange={() => {}}
            handleRemoveAttendee={() => {}}
            event={null}
          />
        ))
      )}
    </div>
    <button 
      className="btn btn-success mt-3" 
      onClick={handleInviteAll}
      disabled={isSending}
    >
      {isSending ? (
        <>
          <span className="spinner-border spinner-border-sm mr-2" role="status" aria-hidden="true" />
          Envoi en cours...
        </>
      ) : (
        <>
          <FontAwesomeIcon icon={faGlobe} className="mr-2" />
          Envoyer à tous
        </>
      )}
    </button>
  </div>
);
export default InviteAllSection;