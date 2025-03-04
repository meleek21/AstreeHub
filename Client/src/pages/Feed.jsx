import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../Context/AuthContext';
import { postsAPI } from '../services/apiServices';
import '../assets/Css/Feed.css';

function Feed() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token || !isAuthenticated) {
          console.log('No token or not authenticated, redirecting to login');
          navigate('/authen');
          return;
        }

        console.log('Fetching posts - Starting request');
        
        // Use the postsAPI service instead of direct axios call
        const response = await postsAPI.getAllPosts();

        console.log('API Response status:', response.status);
        console.log('Posts received:', response.data.length);

        setPosts(response.data);
      } catch (err) {
        console.error('Error fetching posts:', err);

        // Check if error is authentication related
        if (err.response && (err.response.status === 401 || err.response.status === 403)) {
          console.error('Authentication error:', err.response.data);
          
          // Be more specific about when to logout - only for actual token errors
          const errorMessage = JSON.stringify(err.response.data || '').toLowerCase();
          const isTokenError = 
            errorMessage.includes('invalid token') || 
            errorMessage.includes('expired token') || 
            errorMessage.includes('malformed token');
          
          if (isTokenError) {
            console.log('Token-related authentication error, logging out');
            setError('Authentication error. Please log in again.');
            logout();
            return;
          } else {
            // For general 401/403 errors that aren't specifically token-related
            // Just show an error but don't log out
            setError('Access denied. You may not have permission to view these posts.');
            return;
          }
        }

        setError('Failed to fetch posts. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, [isAuthenticated, navigate, logout]);

  if (loading) return <div className="loading-container">Loading...</div>;
  if (error) return <div className="error-container">{error}</div>;
  if (!posts || posts.length === 0) return <div className="no-posts">No posts available.</div>;

  return (
    <div className="feed-container">
      <h1 className="feed-title">Posts Feed</h1>
      <div className="posts-list">
        {posts.map((post) => (
          <div key={post.id || post._id} className="post-card">
            <h2 className="post-title">{post.title || 'Untitled Post'}</h2>
            <p className="post-content">{post.content}</p>
            <div className="post-meta">
              <span>Posted by: {post.authorName || 'Unknown'}</span>
              <span>Date: {new Date(post.createdAt || post.timestamp).toLocaleDateString()}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Feed;