import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { postsAPI } from '../../services/apiServices';
import '../../assets/Css/ProfileViewer.css';
import PostCard from '../Posts/PostCard';
import ProfileCard from './ProfileCard';
import CommentModal from '../Comments/CommentModal';
import { useAuth } from '../../Context/AuthContext';

const ProfileViewer = () => {
  const { userId } = useParams(); // This is the profile being viewed
  const { user } = useAuth(); // This is the logged-in user
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
          <PostCard 
            key={post.id} 
            post={post} 
            userId={user?.id} // Pass the logged-in user's ID, not the profile owner's ID
            onCommentClick={openCommentsModal} 
            setSelectedPostId={setSelectedPostId} 
          />
        ))}
      </div>
      <CommentModal
        isOpen={isCommentsModalOpen}
        onClose={closeCommentsModal}
        postId={selectedPostId}
        userId={user?.id} // Also use logged-in user's ID here
        isAuthenticated={true}
        token={null}
      />
    </div>
  );
};

export default ProfileViewer;