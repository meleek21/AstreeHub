import { useState, useEffect } from 'react';
import axios from 'axios';
import '../assets/Css/Comment.css';

function Comment({ postId }) {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');

  useEffect(() => {
    const fetchComments = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get(`http://localhost:5126/api/comment/post/${postId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setComments(response.data);
      } catch (error) {
        console.error('Erreur lors du chargement des commentaires', error);
      }
    };
    fetchComments();
  }, [postId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        'http://localhost:5126/api/comment',
        { postId, content: newComment },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setComments([...comments, response.data]);
      setNewComment('');
    } catch (error) {
      console.error('Erreur lors de l’ajout du commentaire', error);
    }
  };

  return (
    <div className="comment-container">
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Ajouter un commentaire..."
        />
        <button type="submit">Envoyer</button>
      </form>
      {comments.map((comment) => (
        <div key={comment.id} className="comment">
          <span className="comment-author">{comment.authorName || 'Utilisateur'}</span>
          <span className="comment-content">{comment.content}</span>
        </div>
      ))}
    </div>
  );
}

export default Comment;