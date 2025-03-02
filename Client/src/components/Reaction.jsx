import { useState, useEffect } from 'react';
import axios from 'axios';
import '../assets/Css/Reactions.css';

const reactionTypes = ['Like', 'Love', 'Haha', 'Wow', 'Sad', 'Angry'];

function Reaction({ postId }) {
  const [reactions, setReactions] = useState([]);

  useEffect(() => {
    const fetchReactions = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get(`http://localhost:5126/api/reaction/post/${postId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setReactions(response.data);
      } catch (error) {
        console.error('Erreur lors du chargement des réactions', error);
      }
    };
    fetchReactions();
  }, [postId]);

  const handleReaction = async (type) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        'http://localhost:5126/api/reaction',
        { postId, type },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setReactions(response.data);
    } catch (error) {
      console.error('Erreur lors de l’ajout de la réaction', error);
    }
  };

  return (
    <div className="reaction-container">
      {reactionTypes.map((type) => (
        <button key={type} onClick={() => handleReaction(type)}>
          {type}
        </button>
      ))}
      <span>{reactions.length} Réactions</span>
    </div>
  );
}

export default Reaction;