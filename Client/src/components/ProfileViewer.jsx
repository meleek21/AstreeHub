import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { postsAPI } from '../services/apiServices';
import '../assets/Css/ProfileViewer.css';
import PostCard from './PostCard';
import ProfileCard from './ProfileCard';
import CommentModal from '../components/Comments/CommentModal';

const ProfileViewer = () => {
  const { userId } = useParams();
  const [posts, setPosts] = useState([]);
  const [isCommentsModalOpen, setIsCommentsModalOpen] = useState(false);
  const [selectedPostId, setSelectedPostId] = useState(null);

  const openCommentsModal = (postId) => {
    setSelectedPostId(postId);
    setIsCommentsModalOpen(true);
  };

  const closeCommentsModal = () => {
    setIsCommentsModalOpen(false);
    setSelectedPostId(null);
  };
  
  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const response = await postsAPI.getPostsByAuthor(userId);
        setPosts(response.data.posts);
        console.log('response', response.data);
      } catch (error) {
        console.error('Error fetching posts:', error);
      }
    };
  
    fetchPosts();
  }, [userId]);

  return (
    <div className="profile-viewer-container">
      <div className="profile-section">
        <ProfileCard />
      </div>
      <div className="posts-section">
        {posts.map(post => (
          <PostCard key={post.id} post={post} userId={userId} onCommentClick={openCommentsModal} setSelectedPostId={setSelectedPostId} />
        ))}
      </div>
      <CommentModal
        isOpen={isCommentsModalOpen}
        onClose={closeCommentsModal}
        postId={selectedPostId}
        userId={userId}
        isAuthenticated={true}
        token={null}
      />
    </div>
  );
};

export default ProfileViewer;