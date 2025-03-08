import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../Context/AuthContext';
import { postsAPI } from '../services/apiServices';
import signalRService from '../services/signalRService';
import CreatePost from '../components/CreatePost';
import Comment from '../components/Comment';
import Reaction from '../components/Reaction';
import '../assets/Css/Feed.css';
import toast from 'react-hot-toast';

// PostCard component
const PostCard = ({ post, userId, isAuthenticated, token, onDeletePost, onUpdatePost }) => {
  return (
    <div key={post.id || post._id} className="post-card">
      <div className="post-meta">
        <span>Publié par : {post.authorName || 'Inconnu'}</span>
        <span>Date : {new Date(post.createdAt || post.timestamp).toLocaleDateString()}</span>
      </div>
      <p className="post-content">{post.content}</p>
      <Comment 
        postId={post.id} 
        userId={userId} 
        isAuthenticated={isAuthenticated}
        token={token}
      />
      <Reaction postId={post.id} employeeId={userId} />
      {/* 3-Dot Menu for Posts by the Logged-In User */}
      {post.authorId === userId && (
        <div className="post-actions">
          <div className="dropdown">
            <button className="dropdown-toggle" aria-label="Options">&#8942;</button>
            <div className="dropdown-content">
              <button onClick={() => onUpdatePost(post.id)}>Modifier</button>
              <button onClick={() => onDeletePost(post.id)}>Supprimer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

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

  // Initialize SignalR connection
  useEffect(() => {
    const initializeSignalR = async () => {
      try {
        // Register event handlers
        signalRService.onConnectionChange(setSignalRConnected);
        
        signalRService.onNewPost((newPost) => {
          console.log('New post received via SignalR:', newPost);
          setPosts(prevPosts => [newPost, ...prevPosts]);
          toast.success('Nouvelle publication reçue!');
        });
        
        signalRService.onUpdatedPost((updatedPost) => {
          console.log('Updated post received via SignalR:', updatedPost);
          setPosts(prevPosts => 
            prevPosts.map(post => 
              post.id === updatedPost.id ? updatedPost : post
            )
          );
        });
        
        signalRService.onDeletedPost((deletedPostId) => {
          console.log('Deleted post received via SignalR:', deletedPostId);
          setPosts(prevPosts => 
            prevPosts.filter(post => post.id !== deletedPostId)
          );
        });
        
        // Add handlers for comment events
        signalRService.onNewComment((comment) => {
          console.log('New comment received via SignalR:', comment);
          // Refresh the post that received the comment
          postsAPI.getPostById(comment.postId)
            .then(response => {
              setPosts(prevPosts => 
                prevPosts.map(post => 
                  post.id === comment.postId ? response.data : post
                )
              );
            })
            .catch(err => console.error('Error fetching updated post after new comment:', err));
        });
        
        signalRService.onUpdatedComment((comment) => {
          console.log('Updated comment received via SignalR:', comment);
          // Refresh the post that contains the updated comment
          postsAPI.getPostById(comment.postId)
            .then(response => {
              setPosts(prevPosts => 
                prevPosts.map(post => 
                  post.id === comment.postId ? response.data : post
                )
              );
            })
            .catch(err => console.error('Error fetching updated post after comment update:', err));
        });
        
        signalRService.onDeletedComment((commentId) => {
          console.log('Deleted comment received via SignalR:', commentId);
          // We need to refresh all posts since we don't know which post the comment belonged to
          postsAPI.getAllPosts()
            .then(response => {
              setPosts(response.data);
            })
            .catch(err => console.error('Error fetching posts after comment deletion:', err));
        });
        
        signalRService.onNewReply((reply, parentCommentId) => {
          console.log('New reply received via SignalR:', reply, 'Parent comment ID:', parentCommentId);
          // Refresh the post that contains the comment that received the reply
          postsAPI.getPostById(reply.postId)
            .then(response => {
              setPosts(prevPosts => 
                prevPosts.map(post => 
                  post.id === reply.postId ? response.data : post
                )
              );
            })
            .catch(err => console.error('Error fetching updated post after new reply:', err));
        });
        
        // Add handlers for reaction events
        signalRService.onNewReaction((reaction) => {
          console.log('New reaction received via SignalR:', reaction);
          // Refresh the post that received the reaction
          postsAPI.getPostById(reaction.postId)
            .then(response => {
              setPosts(prevPosts => 
                prevPosts.map(post => 
                  post.id === reaction.postId ? response.data : post
                )
              );
            })
            .catch(err => console.error('Error fetching updated post after new reaction:', err));
        });
        
        signalRService.onUpdatedReaction((reaction) => {
          console.log('Updated reaction received via SignalR:', reaction);
          // Refresh the post that contains the updated reaction
          postsAPI.getPostById(reaction.postId)
            .then(response => {
              setPosts(prevPosts => 
                prevPosts.map(post => 
                  post.id === reaction.postId ? response.data : post
                )
              );
            })
            .catch(err => console.error('Error fetching updated post after reaction update:', err));
        });
        
        signalRService.onDeletedReaction((reactionId) => {
          console.log('Deleted reaction received via SignalR:', reactionId);
          // We need to refresh all posts since we don't know which post the reaction belonged to
          postsAPI.getAllPosts()
            .then(response => {
              setPosts(response.data);
            })
            .catch(err => console.error('Error fetching posts after reaction deletion:', err));
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
          navigate('/authen');
          return;
        }

        console.log('Récupération des publications - Début de la requête');

        // Utiliser le service postsAPI au lieu d'un appel axios direct
        const response = await postsAPI.getAllPosts();

        console.log('Statut de la réponse API :', response.status);
        console.log('Publications reçues :', response.data.length);
        console.log('Réponse API :', response.data);
        setPosts(response.data);
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
  const handleUpdatePost = (postId) => {
    // Navigate to the update post page or open a modal
    navigate(`/update-post/${postId}`);
  };

  if (loading) return <div className="loading-container">Chargement en cours...</div>;
  if (error) return <div className="error-container">{error}</div>;
  if (!posts || posts.length === 0) return <div className="no-posts">Aucune publication disponible.</div>;

  return (
    <div className="feed-container">
      <h1 className="feed-title">Fil d'Actualités</h1>
      {signalRConnected && <div className="realtime-indicator">Mises à jour en temps réel activées</div>}
      <CreatePost />
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
          />
        ))}
      </div>
    </div>
  );
}

export default Feed;