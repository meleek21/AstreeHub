import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../Context/AuthContext';
import { postsAPI } from '../services/apiServices';
import signalRService from '../services/signalRService';
import CreatePost from '../components/CreatePost';
import PostCard from '../components/PostCard'; // Import the PostCard component
import Comment from '../components/Comment'; // Import the Comment component
import '../assets/Css/Feed.css';
import toast from 'react-hot-toast';

// Main Feed component
function Feed() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [signalRConnected, setSignalRConnected] = useState(false);
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
      const response = await postsAPI.getAllPosts(currentLastItemId);

      if (!response.data) {
        throw new Error('No data received from server');
      }

      // Extract paginated data with correct property names
      const { posts = [], nextLastItemId, hasMore } = response.data;
      if (!Array.isArray(posts)) {
        console.error('Posts data is not an array:', posts);
        setPosts([]);
        return;
      }

      setPosts((prevPosts) => (isInitial ? posts : [...prevPosts, ...posts]));
      setLastItemId(nextLastItemId);
      setHasMore(hasMore);
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

  // Initialize SignalR connection
  useEffect(() => {
    const initializeSignalR = async () => {
      try {
        // Register event handlers
        signalRService.onConnectionChange(setSignalRConnected);

        signalRService.onNewPost(async (newPost) => {
          console.log('New post received via SignalR:', newPost);
          try {
            // Fetch author information for the new post
            const authorResponse = await postsAPI.getPostById(newPost.id);
            const postWithAuthor = authorResponse.data;
            if (postWithAuthor && postWithAuthor.authorName) {
              setPosts((prevPosts) => [postWithAuthor, ...prevPosts]);
              toast.success('Nouvelle publication reçue!');
            } else {
              console.error('Post received without author information');
              toast.error('Erreur lors de la récupération des détails de la publication');
            }
          } catch (error) {
            console.error('Error fetching post details:', error);
            toast.error('Erreur lors de la récupération des détails de la publication');
            // Do not add the post until we have complete information
            console.log('Skipping post addition due to missing author information');
          }
        });

        signalRService.onUpdatedPost((updatedPost) => {
          console.log('Updated post received via SignalR:', updatedPost);
          // Fetch the complete post data with author information
          postsAPI
            .getPostById(updatedPost.id)
            .then((response) => {
              setPosts((prevPosts) =>
                prevPosts.map((post) =>
                  post.id === updatedPost.id ? response.data : post
                )
              );
            })
            .catch((err) =>
              console.error('Error fetching updated post details:', err)
            );
        });

        signalRService.onDeletedPost((deletedPostId) => {
          console.log('Deleted post received via SignalR:', deletedPostId);
          setPosts((prevPosts) =>
            prevPosts.filter((post) => post.id !== deletedPostId)
          );
        });

        // Add handlers for comment events
        signalRService.onNewComment((comment) => {
          console.log('New comment received via SignalR:', comment);
          // Refresh the post that received the comment
          postsAPI
            .getPostById(comment.postId)
            .then((response) => {
              setPosts((prevPosts) =>
                prevPosts.map((post) =>
                  post.id === comment.postId ? response.data : post
                )
              );
            })
            .catch((err) =>
              console.error('Error fetching updated post after new comment:', err)
            );
        });

        signalRService.onUpdatedComment((comment) => {
          console.log('Updated comment received via SignalR:', comment);
          // Refresh the post that contains the updated comment
          postsAPI
            .getPostById(comment.postId)
            .then((response) => {
              setPosts((prevPosts) =>
                prevPosts.map((post) =>
                  post.id === comment.postId ? response.data : post
                )
              );
            })
            .catch((err) =>
              console.error('Error fetching updated post after comment update:', err)
            );
        });

        signalRService.onDeletedComment((commentId) => {
          console.log('Deleted comment received via SignalR:', commentId);
          // We need to refresh all posts since we don't know which post the comment belonged to
          postsAPI
            .getAllPosts()
            .then((response) => {
              setPosts(response.data);
            })
            .catch((err) =>
              console.error('Error fetching posts after comment deletion:', err)
            );
        });

        signalRService.onNewReply((reply, parentCommentId) => {
          console.log('New reply received via SignalR:', reply, 'Parent comment ID:', parentCommentId);
          // Refresh the post that contains the comment that received the reply
          postsAPI
            .getPostById(reply.postId)
            .then((response) => {
              setPosts((prevPosts) =>
                prevPosts.map((post) =>
                  post.id === reply.postId ? response.data : post
                )
              );
            })
            .catch((err) =>
              console.error('Error fetching updated post after new reply:', err)
            );
        });

        // Add handlers for reaction events
        signalRService.onNewReaction((reaction) => {
          console.log('New reaction received via SignalR:', reaction);
          // Refresh the post that received the reaction
          postsAPI
            .getPostById(reaction.postId)
            .then((response) => {
              setPosts((prevPosts) =>
                prevPosts.map((post) =>
                  post.id === reaction.postId ? response.data : post
                )
              );
            })
            .catch((err) =>
              console.error('Error fetching updated post after new reaction:', err)
            );
        });

        signalRService.onUpdatedReaction((reaction) => {
          console.log('Updated reaction received via SignalR:', reaction);
          // Refresh the post that contains the updated reaction
          postsAPI
            .getPostById(reaction.postId)
            .then((response) => {
              setPosts((prevPosts) =>
                prevPosts.map((post) =>
                  post.id === reaction.postId ? response.data : post
                )
              );
            })
            .catch((err) =>
              console.error('Error fetching updated post after reaction update:', err)
            );
        });

        signalRService.onDeletedReaction((reactionId) => {
          console.log('Deleted reaction received via SignalR:', reactionId);
          // We need to refresh all posts since we don't know which post the reaction belonged to
          postsAPI
            .getAllPosts()
            .then((response) => {
              setPosts(response.data);
            })
            .catch((err) =>
              console.error('Error fetching posts after reaction deletion:', err)
            );
        });

        // Add handlers for file events
        signalRService.onNewFile((file) => {
          console.log('New file received via SignalR in Feed component:', file);
          // Refresh the post that received the new file
          if (file.postId) {
            console.log('Fetching updated post with new file, postId:', file.postId);
            postsAPI
              .getPostById(file.postId)
              .then((response) => {
                console.log('Updated post data received:', response.data);
                setPosts((prevPosts) =>
                  prevPosts.map((post) =>
                    post.id === file.postId ? response.data : post
                  )
                );
                toast.success('Nouveau fichier ajouté!');
              })
              .catch((err) =>
                console.error('Error fetching updated post after new file:', err)
              );
          } else {
            // If we don't know which post the file belongs to, refresh all posts
            console.log('File has no postId, refreshing all posts');
            postsAPI
              .getAllPosts()
              .then((response) => {
                setPosts(response.data);
              })
              .catch((err) =>
                console.error('Error fetching posts after new file:', err)
              );
          }
        });

        signalRService.onUpdatedFile((file) => {
          console.log('Updated file received via SignalR:', file);
          // Refresh the post that contains the updated file
          if (file.postId) {
            postsAPI
              .getPostById(file.postId)
              .then((response) => {
                setPosts((prevPosts) =>
                  prevPosts.map((post) =>
                    post.id === file.postId ? response.data : post
                  )
                );
              })
              .catch((err) =>
                console.error('Error fetching updated post after file update:', err)
              );
          } else {
            // If we don't know which post the file belongs to, refresh all posts
            postsAPI
              .getAllPosts()
              .then((response) => {
                setPosts(response.data);
              })
              .catch((err) =>
                console.error('Error fetching posts after file update:', err)
              );
          }
        });

        signalRService.onDeletedFile((fileId) => {
          console.log('Deleted file received via SignalR in Feed component:', fileId);
          // We need to refresh all posts since we don't know which post the file belonged to
          console.log('Refreshing all posts after file deletion');
          postsAPI
            .getAllPosts()
            .then((response) => {
              console.log('Updated posts received after file deletion:', response.data.length);
              setPosts(response.data);
              toast.info('Un fichier a été supprimé');
            })
            .catch((err) =>
              console.error('Error fetching posts after file deletion:', err)
            );
        });

        // Start the connection
        await signalRService.start();
      } catch (err) {
        console.error('Error initializing SignalR:', err);
      }
    };

    if (isAuthenticated) {
      initializeSignalR();
    }

    // Cleanup on unmount
    return () => {
      signalRService.stop();
    };
  }, [isAuthenticated]);

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token || !isAuthenticated) {
          console.log('Pas de token ou non authentifié, redirection vers la page de connexion');
          navigate('/Authen');
          return;
        }

        console.log('Récupération des publications - Début de la requête');

        // Utiliser le service postsAPI au lieu d'un appel axios direct
        const response = await postsAPI.getAllPosts();

        console.log('Statut de la réponse API :', response.status);
        console.log('Réponse API :', response.data);

        // Extract posts from the paginated response
        const posts = response.data?.posts || [];
        console.log('Publications reçues :', posts.length);
        setPosts(posts);
      } catch (err) {
        console.error('Erreur lors de la récupération des publications :', err);

        // Vérifier si l'erreur est liée à l'authentification
        if (err.response && (err.response.status === 401 || err.response.status === 403)) {
          console.error('Erreur d\'authentification :', err.response.data);

          // Être plus spécifique sur quand déconnecter - uniquement pour les erreurs de token
          const errorMessage = JSON.stringify(err.response.data || '').toLowerCase();
          const isTokenError =
            errorMessage.includes('invalid token') ||
            errorMessage.includes('expired token') ||
            errorMessage.includes('malformed token');

          if (isTokenError) {
            console.log('Erreur d\'authentification liée au token, déconnexion');
            setError('Erreur d\'authentification. Veuillez vous reconnecter.');
            logout();
            return;
          } else {
            // Pour les erreurs 401/403 générales qui ne sont pas spécifiquement liées au token
            // Afficher simplement une erreur mais ne pas déconnecter
            setError('Accès refusé. Vous n\'avez peut-être pas la permission de voir ces publications.');
            return;
          }
        }

        setError('Échec de la récupération des publications. Veuillez réessayer plus tard.');
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, [isAuthenticated, navigate, logout]);

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
      const postData = {
        Content: updatedData.content,
        AuthorId: userId,
        IsPublic: updatedData.isPublic || true, // Default to true if not provided
        FileIds: updatedData.fileIds || [], // Default to an empty array if not provided
      };
  
      await postsAPI.updatePost(postId, postData);
      toast.success('Publication mise à jour avec succès !');
  
      // Update the local state to reflect the changes
      setPosts((prevPosts) =>
        prevPosts.map((post) =>
          post.id === postId ? { ...post, content: updatedData.content } : post
        )
      );
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
        <div className={`comments-modal ${isCommentsModalOpen ? 'open' : ''}`}>
          <div className="modal-content">
            <button className="close-modal" onClick={closeCommentsModal}>
              &times;
            </button>
            <Comment
              postId={selectedPostId}
              userId={userId}
              isAuthenticated={isAuthenticated}
              token={token}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default Feed;