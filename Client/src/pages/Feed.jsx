import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import '../assets/Css/Feed.css';

function Feed() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        console.log('Fetching posts - Starting request');
        const token = localStorage.getItem('token');
        console.log('Token status:', token ? 'Token found' : 'No token');

        if (!token) {
          throw new Error('No authentication token found');
        }

        console.log('Making API request to:', 'http://localhost:5126/api/post');
        console.log('Request headers:', { Authorization: `Bearer ${token.substring(0, 10)}...` });

        const response = await axios.get('http://localhost:5126/api/post', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        console.log('API Response status:', response.status);
        console.log('API Response data:', response.data ? 'Data received' : 'No data');

        setPosts(response.data);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching posts:', {
          status: err.response?.status,
          statusText: err.response?.statusText,
          data: err.response?.data,
          config: {
            url: err.config?.url,
            method: err.config?.method,
            headers: err.config?.headers
          }
        });
        setError('Failed to fetch posts. Please log in again.');
        setLoading(false);
      }
    };

    if (isAuthenticated) {
      console.log('User is authenticated, fetching posts...');
      fetchPosts();
    } else {
      console.log('User is not authenticated');
      setError('You must be logged in to view posts.');
    }
  }, [isAuthenticated]);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>{error}</div>;

  return (
    <div className="feed-container">
      <h1>Feed</h1>
      <div className="posts-list">
        {posts.map((post) => (
          <div key={post.id} className="post-card">
            <h3>{post.title}</h3>
            <p>{post.content}</p>
            <div className="post-meta">
              <span>Posted by: {post.authorName}</span>
              <span>Date: {new Date(post.createdAt).toLocaleDateString()}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Feed;