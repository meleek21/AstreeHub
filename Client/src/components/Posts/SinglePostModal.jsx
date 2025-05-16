import React, { useEffect, useState, useRef } from "react";
import ModalPortal from "../ModalPortal";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTimes } from "@fortawesome/free-solid-svg-icons";
import { postsAPI } from "../../services/apiServices";
import PostCard from "../PostCard";
import Comment from "../Comments/Comment";
import Reaction from "../Reactions/Reaction";

const SinglePostModal = ({ isOpen, onClose, postId, userId, isAuthenticated, token }) => {
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const modalRef = useRef(null);

  useEffect(() => {
    if (isOpen && postId) {
      setLoading(true);
      setError(null);
      postsAPI.getPostById(postId)
        .then((res) => {
          setPost(res.data);
        })
        .catch((err) => {
          setError("Failed to load post.");
        })
        .finally(() => setLoading(false));
    } else {
      setPost(null);
    }
  }, [isOpen, postId]);

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
      <div className={`single-post-modal ${isOpen ? "open" : ""}`}>
        <div className="modal-content" ref={modalRef}>
          <button className="close-modal" onClick={onClose}>
            <FontAwesomeIcon icon={faTimes} />
          </button>
          {loading && <div>Loading...</div>}
          {error && <div style={{color: 'red'}}>{error}</div>}
          {post && (
            <>
              <PostCard
                post={post}
                userId={userId}
                isAuthenticated={isAuthenticated}
                token={token}
                onCommentClick={null} /* Disable comment button in modal */
              />
              <div style={{marginTop: 24}}>
                <Comment
                  postId={post.id}
                  userId={userId}
                  isAuthenticated={isAuthenticated}
                  token={token}
                />
              </div>
            </>
          )}
        </div>
      </div>
    </ModalPortal>
  );
};

export default SinglePostModal;