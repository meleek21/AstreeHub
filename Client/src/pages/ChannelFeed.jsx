import { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../Context/AuthContext';
import { postsAPI } from '../services/apiServices';
import PostCard from '../components/PostCard';
import CreatePost from '../components/CreatePost';
import Comment from '../components/Comments/Comment';
import '../assets/Css/Feed.css';
import toast from 'react-hot-toast';
import { createPortal } from "react-dom";

function ChannelFeed() {
  const { channelId } = useParams();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user } = useAuth();
  const observerTarget = useRef(null);

  // State for infinite scroll
  const [lastItemId, setLastItemId] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  // State for comments modal
  const [isCommentsModalOpen, setIsCommentsModalOpen] = useState(false);
  const [selectedPostId, setSelectedPostId] = useState(null);

  // Open comments modal
  const openCommentsModal = (postId) => {
    setSelectedPostId(postId);
    setIsCommentsModalOpen(true);
  };

  // Close comments modal
  const closeCommentsModal = () => {
    setIsCommentsModalOpen(false);
    setSelectedPostId(null);
  };

  // Fetch posts with pagination
  const fetchPosts = async (isInitial = true) => {
    try {
      if (isInitial) {
        setLoading(true);
        setError(null);
      } else {
        setLoadingMore(true);
      }

      const currentLastItemId = isInitial ? null : lastItemId;
      const response = await postsAPI.getChannelPosts(channelId, currentLastItemId);

      if (!response.data) {
        throw new Error('No data received from server');
      }

      const { posts: fetchedPosts = [], nextLastItemId, hasMore: hasMorePosts } = response.data;
      if (!Array.isArray(fetchedPosts)) {
        console.error('Posts data is not an array:', fetchedPosts);
        setPosts([]);
        return;
      }

      setPosts((prevPosts) => (isInitial ? fetchedPosts : [...prevPosts, ...fetchedPosts]));
      setLastItemId(nextLastItemId);
      setHasMore(hasMorePosts);
    } catch (err) {
      console.error('Error fetching posts:', err);
      setError('Failed to load posts. Please try again later.');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  // Initialize and fetch initial posts
  useEffect(() => {
    fetchPosts(true);
  }, [channelId]);

  // Setup infinite scroll observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore && !loading) {
          fetchPosts(false);
        }
      },
      { threshold: 0.5 }
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => {
      if (observerTarget.current) {
        observer.unobserve(observerTarget.current);
      }
    };
  }, [hasMore, loadingMore, loading]);

  // Function to handle post deletion
  const handleDeletePost = async (postId) => {
    try {
      await postsAPI.deletePost(postId);
      toast.success('Publication supprimée avec succès !');
      fetchPosts(true); // Refresh posts after deletion
    } catch (err) {
      console.error('Erreur lors de la suppression de la publication :', err);
      toast.error('Échec de la suppression de la publication. Veuillez réessayer.');
    }
  };

  // Function to handle post update
  const handleUpdatePost = async (postId, updatedData) => {
    try {
      await postsAPI.updatePost(postId, updatedData);
      toast.success('Publication mise à jour avec succès !');
      fetchPosts(true); // Refresh posts after update
    } catch (err) {
      console.error('Erreur lors de la mise à jour de la publication :', err);
      toast.error('Échec de la mise à jour de la publication. Veuillez réessayer.');
    }
  };

  if (loading) {
    return <div className="loading-container">Loading posts...</div>;
  }

  if (error) {
    return <div className="error-container">{error}</div>;
  }

  return (
    <div className="feed-container">
      <CreatePost channelId={channelId} />
      <div className="posts-container">
        {posts.length === 0 ? (
          <div className="no-posts">No posts available in this channel</div>
        ) : (
          posts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              userId={user?.id}
              isAuthenticated={true}
              token={localStorage.getItem('token')}
              onDeletePost={handleDeletePost}
              onUpdatePost={handleUpdatePost}
              openCommentsModal={openCommentsModal}
              onCommentClick={openCommentsModal}
            />
          ))
        )}
        {loadingMore && <div className="loading-more">Loading more posts...</div>}
        <div ref={observerTarget} style={{ height: '20px' }} />
      </div>

      {isCommentsModalOpen && selectedPostId && (
        createPortal(
          <div className={`comments-modal ${isCommentsModalOpen ? 'open' : ''}`}>
            <button className="close-modal" onClick={closeCommentsModal}>
              &times;
            </button>
            <Comment
              postId={selectedPostId}
              userId={user?.id}
              isAuthenticated={true}
              token={localStorage.getItem('token')}
            />
          </div>,
          document.body
        )
      )}
    </div>
  );
}

export default ChannelFeed;