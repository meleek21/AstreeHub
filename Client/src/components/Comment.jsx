import React, { useState, useEffect } from 'react';
import axios from 'axios';
import signalRService from '../services/signalRService';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPaperPlane, faReply } from '@fortawesome/free-solid-svg-icons';
import toast, { Toaster } from 'react-hot-toast';
import '../assets/Css/Comment.css';

const API_BASE_URL = 'http://localhost:5126/api';

// Fonction pour récupérer le token d'authentification
const getAuthToken = (token) => {
    return token || localStorage.getItem('token');
};

// Fonction pour les requêtes API avec authentification
const authRequest = async (url, method = 'get', data = null, token) => {
    const authToken = getAuthToken(token);
    
    if (!authToken) {
        throw new Error("Aucun token d'authentification disponible");
    }
    
    return axios({
        method,
        url: `${API_BASE_URL}${url}`,
        headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json'
        },
        data,
        withCredentials: true
    });
};

// Récupérer les informations de l'auteur
const fetchAuthorInfo = async (authorId, token) => {
    try {
        const response = await authRequest(`/employee/user-info/${authorId}`, 'get', null, token);
        return response.data;
    } catch (err) {
        console.error(`Erreur lors de la récupération des informations de l'auteur ${authorId}:`, err);
        return null;
    }
};

// Composant CommentItem
const CommentItem = ({ comment, authors, userId, onAddReply }) => {
    const [newReply, setNewReply] = useState('');
    const [showReplies, setShowReplies] = useState(false);

    const handleReplyChange = (e) => {
        setNewReply(e.target.value);
    };

    const handleReplySubmit = () => {
        onAddReply(comment.id, newReply);
        setNewReply('');
    };

    return (
        <li key={comment.id} className="comment-item">
            <div className="comment-content">
                <p>{comment.content}</p>
                <small>
                    Par {authors[comment.authorId] ? `${authors[comment.authorId].firstName} ${authors[comment.authorId].lastName}` : "Utilisateur inconnu"} le {new Date(comment.createdAt || comment.timestamp).toLocaleString()}
                </small>
            </div>
            
            {/* Formulaire de réponse */}
            <div className="reply-form">
                <input
                    type="text"
                    value={newReply}
                    onChange={handleReplyChange}
                    placeholder="Écrire une réponse..."
                />
                <button onClick={handleReplySubmit} className="icon-button">
                    <FontAwesomeIcon icon={faReply} />
                </button>
            </div>
            
            {/* Liste des réponses */}
            {comment.replies && comment.replies.length > 0 && (
                <div>
                    <button onClick={() => setShowReplies(!showReplies)} className="toggle-replies">
                        {showReplies ? 'Masquer les réponses' : `Afficher ${comment.replies.length} réponse(s)`}
                    </button>
                    <ul className={`replies-list ${showReplies ? 'visible' : ''}`}>
                        {comment.replies.map((reply) => (
                            <li key={reply.id} className="reply-item fade-in">
                                <p>{reply.content}</p>
                                <small>
                                    Par {authors[reply.authorId] ? `${authors[reply.authorId].firstName} ${authors[reply.authorId].lastName}` : "Utilisateur inconnu"} le {new Date(reply.createdAt || reply.timestamp).toLocaleString()}
                                </small>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </li>
    );
};

// Composant principal Comment
const Comment = ({ postId, userId, isAuthenticated, token }) => {
    const [comments, setComments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [authors, setAuthors] = useState({});
    const [newComment, setNewComment] = useState('');

    useEffect(() => {
        if (!postId || !isAuthenticated) return;
        fetchComments();
    }, [postId, isAuthenticated, token]);

    const fetchComments = async () => {
        try {
            setLoading(true);
            const response = await authRequest(`/comment/post/${postId}`, 'get', null, token);
            const fetchedComments = Array.isArray(response.data) ? response.data : [];
            setComments(fetchedComments);

            // Récupérer les informations des auteurs
            const authorIds = new Set();
            fetchedComments.forEach(comment => {
                authorIds.add(comment.authorId);
                if (comment.replies) {
                    comment.replies.forEach(reply => authorIds.add(reply.authorId));
                }
            });

            const authorsInfo = {};
            for (const authorId of authorIds) {
                const authorInfo = await fetchAuthorInfo(authorId, token);
                if (authorInfo) {
                    authorsInfo[authorId] = authorInfo;
                }
            }

            setAuthors(authorsInfo);
            setLoading(false);
        } catch (err) {
            console.error("Erreur lors de la récupération des commentaires :", err);
            toast.error(`Échec de la récupération des commentaires : ${err.message}`);
            setLoading(false);
        }
    };

    const handleCreateComment = async () => {
        if (!newComment.trim()) {
            toast.error("Le contenu du commentaire ne peut pas être vide");
            return;
        }

        try {
            const optimisticComment = {
                id: `temp-${Date.now()}`,
                content: newComment,
                authorId: userId,
                postId: postId,
                createdAt: new Date().toISOString(),
                replies: []
            };

            setComments(prevComments => [optimisticComment, ...prevComments]);
            setNewComment('');

            await authRequest('/comment', 'post', {
                content: newComment,
                authorId: userId,
                postId: postId
            }, token);

            toast.success("Commentaire publié avec succès !");
        } catch (err) {
            console.error("Erreur lors de la création du commentaire :", err);
            toast.error(`Échec de la publication du commentaire : ${err.message}`);
            fetchComments();
        }
    };

    const handleAddReply = async (commentId, replyContent) => {
        if (!replyContent.trim()) {
            toast.error("Le contenu de la réponse ne peut pas être vide");
            return;
        }

        try {
            setComments(prevComments => 
                prevComments.map(comment => {
                    if (comment.id === commentId) {
                        return {
                            ...comment,
                            replies: [
                                ...(comment.replies || []),
                                {
                                    id: `temp-reply-${Date.now()}`,
                                    content: replyContent,
                                    authorId: userId,
                                    postId: postId,
                                    createdAt: new Date().toISOString()
                                }
                            ]
                        };
                    }
                    return comment;
                })
            );

            await authRequest(`/comment/${commentId}/reply`, 'post', {
                content: replyContent,
                authorId: userId,
                postId: postId
            }, token);

            toast.success("Réponse publiée avec succès !");
        } catch (err) {
            console.error("Erreur lors de l'ajout de la réponse :", err);
            toast.error(`Échec de la publication de la réponse : ${err.message}`);
            fetchComments();
        }
    };

    if (loading) return <div>Chargement des commentaires...</div>;

    return (
        <div className="comment-section">
            <Toaster />
            <p>Commentaires</p>
            
            {comments.length > 0 ? (
                <ul className="comments-list">
                    {comments.map((comment) => (
                        <CommentItem
                            key={comment.id}
                            comment={comment}
                            authors={authors}
                            userId={userId}
                            onAddReply={handleAddReply}
                        />
                    ))}
                </ul>
            ) : (
                <p>Soyez le premier à réagir !</p>
            )}
            
            <div className="comment-form">
                <textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Ajouter un commentaire..."
                />
                <button onClick={handleCreateComment} className="icon-button">
                    <FontAwesomeIcon icon={faPaperPlane} />
                </button>
            </div>
        </div>
    );
};

export default Comment;