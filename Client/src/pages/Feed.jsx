import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../Context/AuthContext';
import { postsAPI } from '../services/apiServices';
import CreatePost from '../components/CreatePost';
import Comment from '../components/Comment';
import '../assets/Css/Feed.css';
import toast from 'react-hot-toast'; 

function Feed() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { isAuthenticated, logout, user } = useAuth();
  const userId = user?.id; 
  const token = localStorage.getItem('token');
  const navigate = useNavigate();

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
      setPosts(posts.filter((post) => post.id !== postId)); 
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
      <CreatePost />
      <div className="posts-list">
        {posts.map((post) => (
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
            {/* 3-Dot Menu for Posts by the Logged-In User */}
            {post.authorId === userId && (
              <div className="post-actions">
                <div className="dropdown">
                  <button className="dropdown-toggle">&#8942;</button>
                  <div className="dropdown-content">
                    <button onClick={() => handleUpdatePost(post.id)}>Modifier</button>
                    <button onClick={() => handleDeletePost(post.id)}>Supprimer</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default Feed;