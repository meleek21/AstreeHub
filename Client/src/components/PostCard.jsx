import React, { useState } from 'react';
import Reaction from './Reaction';
import '../assets/Css/PostCard.css';

const PostCard = ({ post, userId, isAuthenticated, token, onDeletePost, onUpdatePost, openCommentsModal }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false); // State for 3-dot menu

  // Toggle the dropdown menu
  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  // Close the dropdown menu
  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  return (
    <div key={post.id || post._id} className="post-card">
      {/* Post Header with Author, Date, and 3-Dot Menu */}
      <div className="post-header">
        <div className="post-meta">
          <span className="post-author">Publié par : {post.authorName || 'Inconnu'}</span>
          <span className="post-date">Date : {new Date(post.createdAt || post.timestamp).toLocaleDateString()}</span>
        </div>
        {/* 3-Dot Menu for Posts by the Logged-In User */}
        {post.authorId === userId && (
          <div className="post-actions">
            <div className="post-edit-menu custom-post-edit-menu">
              <button
                className="post-edit-toggle"
                aria-label="Options"
                onClick={toggleMenu} // Toggle menu on click
              >
                &#8942;
              </button>
              {/* Conditionally render the dropdown menu */}
              {isMenuOpen && (
                <div className="post-edit-options custom-post-edit-options">
                  <button onClick={() => { onUpdatePost(post.id); closeMenu(); }}>Modifier</button>
                  <button onClick={() => { onDeletePost(post.id); closeMenu(); }}>Supprimer</button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      {/* Post Content */}
      <p className="post-content">{post.content}</p>
      {/* Reaction and Comment Buttons */}
      <div className="post-interaction-buttons">
      <button className="view-comments-button" onClick={() => openCommentsModal(post.id)}>
          Commentaires
        </button>
        <Reaction postId={post.id} employeeId={userId} />
      </div>
    </div>
  );
};

export default PostCard;