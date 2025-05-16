import React, { useEffect, useRef } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTimes } from "@fortawesome/free-solid-svg-icons";
import ModalPortal from "../ModalPortal";
import Comment from "./Comment";

const CommentModal = ({ isOpen, onClose, postId, userId, isAuthenticated, token }) => {
  const modalRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        onClose();
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <ModalPortal>
      <div className={`comments-modal ${isOpen ? "open" : ""}`}>
        <div className="modal-content" ref={modalRef}>
          <button className="close-modal" onClick={onClose}>
            <FontAwesomeIcon icon={faTimes} />
          </button>
          <Comment
            postId={postId}
            userId={userId}
            isAuthenticated={isAuthenticated}
            token={token}
          />
        </div>
      </div>
    </ModalPortal>
  );
};

export default CommentModal;