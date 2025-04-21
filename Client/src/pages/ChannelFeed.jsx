import { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../Context/AuthContext';
import { postsAPI } from '../services/apiServices';
import signalRService from '../services/signalRService';
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
  const [signalRConnected, setSignalRConnected] = useState(false);
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

  // Initialize SignalR connection and fetch initial posts
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

  // Initialize SignalR connection
  useEffect(() => {
    let isComponentMounted = true;
    let connectionInitialized = false;

    const initializeSignalR = async () => {
      try {
        setError(null); // Reset error state before attempting connection
        if (!isComponentMounted) return; // Prevent connection if component is unmounting

        signalRService.onConnectionChange((connected) => {
          if (isComponentMounted) {
            setSignalRConnected(connected);
            if (connected) {
              setError(null); // Clear any previous connection errors
              connectionInitialized = true;
            }
          }
        });

        signalRService.onNewPost(async (newPost) => {
          if (newPost.channelId === channelId) {
            try {
              // Fetch author information for the new post
              const authorResponse = await postsAPI.getPostById(newPost.id);
              const postWithAuthor = authorResponse.data;
              if (postWithAuthor && postWithAuthor.authorName) {
                setPosts((prevPosts) => {
                  const postExists = prevPosts.some(post => post.id === postWithAuthor.id);
                  if (postExists) {
                    console.log('Post already exists, not adding duplicate:', postWithAuthor.id);
                    return prevPosts;
                  }
                  return [postWithAuthor, ...prevPosts];
                });
              } else {
                console.error('Post received without author information');
                toast.error('Erreur lors de la récupération des détails de la publication');
              }
            } catch (error) {
              console.error('Error fetching post details:', error);
              toast.error('Erreur lors de la récupération des détails de la publication');
            }
          }
        });

        signalRService.onUpdatedPost((updatedPost) => {
          if (updatedPost.channelId === channelId) {
            // Don't make another API call, just update the local state
            setPosts((prevPosts) =>
              prevPosts.map((post) =>
                post.id === updatedPost.id ? updatedPost : post
              )
            );
          }
        });

        signalRService.onDeletedPost((deletedPostId) => {
          console.log('Deleted post received via SignalR:', deletedPostId);
          // Directly update the UI state without making another API call
          setPosts((prevPosts) =>
            prevPosts.filter((post) => post.id !== deletedPostId)
          );

        });

        signalRService.onNewComment((comment) => {
          // Don't make an API call, just update the comment in the post directly
          setPosts((prevPosts) => {
            return prevPosts.map((post) => {
              if (post.id === comment.postId) {
                // Add the new comment to the post's comments array
                const updatedComments = [...(post.comments || []), comment];
                return { ...post, comments: updatedComments };
              }
              return post;
            });
          });
        });

        signalRService.onUpdatedComment((comment) => {
          // Don't make an API call, just update the comment in the post directly
          setPosts((prevPosts) => {
            return prevPosts.map((post) => {
              if (post.id === comment.postId) {
                // Update the specific comment in the post's comments array
                const updatedComments = (post.comments || []).map((c) =>
                  c.id === comment.id ? comment : c
                );
                return { ...post, comments: updatedComments };
              }
              return post;
            });
          });
        });

        signalRService.onDeletedComment((commentId) => {
          // Don't refetch all posts, just update the state directly
          setPosts((prevPosts) => {
            return prevPosts.map((post) => {
              // Remove the deleted comment from each post's comments array
              const updatedComments = (post.comments || []).filter((c) => c.id !== commentId);
              return { ...post, comments: updatedComments };
            });
          });
        });

        await signalRService.start();
        console.log('SignalR connection established in ChannelFeed');
      } catch (error) {
        console.error('Error initializing SignalR:', error);
        setError('Failed to initialize real-time updates');
      }
    };

    initializeSignalR();

    return () => {
      isComponentMounted = false;
      if (connectionInitialized && signalRService.connection) {
        signalRService.stop();
      }
    };
  }, [channelId]);

  if (loading) {
    return <div className="loading-container">Loading posts...</div>;
  }


  if (error) {
    return <div className="error-container">{error}</div>;
  }

  // Function to handle post deletion
  const handleDeletePost = async (postId) => {
    try {
      await postsAPI.deletePost(postId);
      toast.success('Publication supprimée avec succès !');
      // No need to update state here as SignalR will handle it
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
    } catch (err) {
      console.error('Erreur lors de la mise à jour de la publication :', err);
      toast.error('Échec de la mise à jour de la publication. Veuillez réessayer.');
    }
  };

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