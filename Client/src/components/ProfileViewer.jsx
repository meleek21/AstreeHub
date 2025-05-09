import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { postsAPI } from '../services/apiServices';
import { motion } from 'framer-motion';
import '../assets/Css/ProfileViewer.css';
import PostCard from './PostCard';
import ProfileCard from './ProfileCard';

const ProfileViewer = () => {
  const { userId } = useParams();
  const [posts, setPosts] = useState([]);

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
          <PostCard key={post.id} post={post} />
        ))}
      </div>
    </div>
  );
};

export default ProfileViewer;