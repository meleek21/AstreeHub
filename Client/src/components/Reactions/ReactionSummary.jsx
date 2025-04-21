import PropTypes from 'prop-types';
import ReactedUsers from './ReactedUsers';
import { useState, useEffect, useRef } from 'react';
import { AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTimes } from "@fortawesome/free-solid-svg-icons";

const ReactionSummary = ({ total, reactedUsers, userInfoMap }) => {
  const [isReactionsModalOpen, setIsReactionsModalOpen] = useState(false);
  const modalRef = useRef();

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        setIsReactionsModalOpen(false);
      }
    };

    if (isReactionsModalOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.body.style.overflow = 'hidden'; // Prevent scrolling
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.body.style.overflow = ''; // Restore scrolling
    };
  }, [isReactionsModalOpen]);

  // Create portal for modal to render outside component hierarchy
  const ModalPortal = () =>
    createPortal(
      <div className="reaction-modal-overlay">
        <div className="reaction-modal" ref={modalRef}>
          <div className="reaction-modal-content">
            <div className="reaction-modal-header">
              <h3>Réactions</h3>
                <FontAwesomeIcon icon={faTimes} className="close-icon" onClick={() => setIsReactionsModalOpen(false)}/>  
            </div>
            <div className="reaction-modal-body">
              {reactedUsers.length > 0 ? (
                <ReactedUsers users={reactedUsers} userInfoMap={userInfoMap} />
              ) : (
                <p>Aucune réaction pour le moment</p>
              )}
            </div>
          </div>
        </div>
      </div>,
      document.body
    );

  return (
    <>
      <button
        className="reaction-total-button"
        onClick={() => setIsReactionsModalOpen(true)}
        aria-label="View reactions details"
      >
        {total} Réactions
      </button>

      <AnimatePresence>
        {isReactionsModalOpen && <ModalPortal />}
      </AnimatePresence>
    </>
  );
};

ReactionSummary.propTypes = {
  total: PropTypes.number.isRequired,
  reactedUsers: PropTypes.array.isRequired,
  userInfoMap: PropTypes.object.isRequired,
};

export default ReactionSummary;