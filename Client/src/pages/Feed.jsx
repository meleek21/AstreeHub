import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../Context/AuthContext';
import { postsAPI } from '../services/apiServices';
import CreatePost from '../components/CreatePost';
import PostCard from '../components/PostCard';
import Comment from '../components/Comments/Comment';
import '../assets/Css/Feed.css';
import toast from 'react-hot-toast';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTimes } from "@fortawesome/free-solid-svg-icons";
import { createPortal } from "react-dom";
import ModalPortal from '../components/ModalPortal';

function Feed() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { isAuthenticated, logout, user } = useAuth();
  const userId = user?.id;
  const token = localStorage.getItem('token');
  const navigate = useNavigate();
  const observerTarget = useRef(null);

  // State for infinite scroll
  const [lastItemId, setLastItemId] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  // State for comments modal
  const [isCommentsModalOpen, setIsCommentsModalOpen] = useState(false);
  const [selectedPostId, setSelectedPostId] = useState(null);
  
  // State for reactions modal
  const [isReactionsModalOpen, setIsReactionsModalOpen] = useState(false);
  const [reactedUsers, setReactedUsers] = useState([]);
  const [userInfoMap, setUserInfoMap] = useState({});

  // Open comments modal
  const openCommentsModal = (postId) => {
    setSelectedPostId(postId);
    setIsCommentsModalOpen(true);
  };

  const commentsModalRef = useRef(null);

  // Close comments modal when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (commentsModalRef.current && !commentsModalRef.current.contains(event.target)) {
        closeCommentsModal();
      }
    };

    if (isCommentsModalOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isCommentsModalOpen]);

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
      const response = await postsAPI.getAllPosts(currentLastItemId);

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

  // Fetch initial posts
  useEffect(() => {
    fetchPosts(true);
  }, []);

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
      const postData = {
        Content: updatedData.content,
        AuthorId: userId,
        IsPublic: updatedData.isPublic || true,
        FileIds: updatedData.fileIds || [],
      };

      await postsAPI.updatePost(postId, postData);
      toast.success('Publication mise à jour avec succès !');
      fetchPosts(true); // Refresh posts after update
    } catch (err) {
      console.error('Erreur lors de la mise à jour de la publication :', err);
      toast.error('Échec de la mise à jour de la publication. Veuillez réessayer.');
    }
  };

  if (loading) return <div className="loading-container">Chargement en cours...</div>;
  if (error) return <div className="error-container">{error}</div>;

  return (
    <div className="feed-container">
      <CreatePost />
      {!loading && (!posts || posts.length === 0) ? (
        <div className="no-posts">Soyez le premier à publier !</div>
      ) : (
        <div className="posts-list">
          {posts.map((post) => (
            <PostCard
              key={post.id || post._id}
              post={post}
              userId={userId}
              isAuthenticated={isAuthenticated}
              token={token}
              onDeletePost={handleDeletePost}
              onUpdatePost={handleUpdatePost}
              openCommentsModal={openCommentsModal}
            />
          ))}
          {hasMore && <div ref={observerTarget} className="loading-more">Chargement en cours...</div>}
        </div>
      )}

      {/* Comments Modal */}
      {isCommentsModalOpen && (
        <ModalPortal>
          <div className={`comments-modal ${isCommentsModalOpen ? 'open' : ''}`}>
            <div className="modal-content" ref={commentsModalRef}>
              <button className="close-modal" onClick={closeCommentsModal}>
                <FontAwesomeIcon icon={faTimes}/>
              </button>
              <Comment
                postId={selectedPostId}
                userId={userId}
                isAuthenticated={isAuthenticated}
                token={token}
              />
            </div>
          </div>
        </ModalPortal>
      )}
    </div>
  );
}

export default Feed;