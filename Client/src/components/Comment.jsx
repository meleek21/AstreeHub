import React, { useState, useEffect } from 'react';
import { commentsAPI, userAPI } from '../services/apiServices';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPaperPlane, faReply, faEdit, faTrash } from '@fortawesome/free-solid-svg-icons';
import toast, { Toaster } from 'react-hot-toast';
import '../assets/Css/Comment.css';
import UserBadge from './UserBadge';



// Récupérer les informations de l'auteur
const fetchAuthorInfo = async (authorId) => {
    try {
        const response = await userAPI.getUserInfo(authorId);
        return response;
    } catch (err) {
        console.error(`Erreur lors de la récupération des informations de l'auteur ${authorId}:`, err);
        return null;
    }
};

// Composant CommentItem
const CommentItem = ({ comment, authors, userId, onAddReply, onEditComment, onDeleteComment }) => {
    const [newReply, setNewReply] = useState('');
    const [showReplies, setShowReplies] = useState(false);
    const [isHovered, setIsHovered] = useState(false);

    const handleReplyChange = (e) => {
        setNewReply(e.target.value);
    };

    const handleReplySubmit = () => {
        onAddReply(comment.id, newReply);
        setNewReply('');
    };

    const handleEdit = () => {
        onEditComment(comment.id, comment.content);
    };

    const handleDelete = () => {
        onDeleteComment(comment.id);
    };

    return (
        <li
            key={comment.id}
            className="comment-item"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <div className="comment-content">
                <div className="comment-header">
                    <UserBadge userId={comment.authorId} />
                    <small>le {new Date(comment.createdAt || comment.timestamp).toLocaleString()}</small>
                </div>
                <p>{comment.content}</p>
                <small>
                    Par {authors[comment.authorId] ? `${authors[comment.authorId].firstName} ${authors[comment.authorId].lastName}` : "Utilisateur inconnu"} le {new Date(comment.createdAt || comment.timestamp).toLocaleString()}
                </small>
                {comment.authorId === userId && isHovered && (
                    <div className="comment-actions">
                        <button onClick={handleEdit} className="action-button">
                            <FontAwesomeIcon icon={faEdit} style={{color:'#FF6600'}} />
                        </button>
                        <button onClick={handleDelete} className="action-button">
                            <FontAwesomeIcon icon={faTrash} style={{ color: '#D32F2F' }} />
                        </button>
                    </div>
                )}
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
                            <li
                                key={reply.id}
                                className="reply-item fade-in"
                                onMouseEnter={() => setIsHovered(true)}
                                onMouseLeave={() => setIsHovered(false)}
                            >
                                <div className="reply-content">
                                    <div className="reply-header">
                                        <UserBadge userId={reply.authorId} />
                                        <small>le {new Date(reply.createdAt || reply.timestamp).toLocaleString()}</small>
                                    </div>
                                    <p>{reply.content}</p>
                                </div>
                                <small>
                                    Par {authors[reply.authorId] ? `${authors[reply.authorId].firstName} ${authors[reply.authorId].lastName}` : "Utilisateur inconnu"} le {new Date(reply.createdAt || reply.timestamp).toLocaleString()}
                                </small>
                                {reply.authorId === userId && isHovered && (
                                    <div className="comment-actions">
                                        <button onClick={() => onEditComment(reply.id, reply.content)} className="action-button">
                                            <FontAwesomeIcon icon={faEdit} />
                                        </button>
                                        <button onClick={() => onDeleteComment(reply.id)} className="action-button">
                                            <FontAwesomeIcon icon={faTrash} />
                                        </button>
                                    </div>
                                )}
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
    const [editingCommentId, setEditingCommentId] = useState(null);
    const [editingCommentContent, setEditingCommentContent] = useState('');

    useEffect(() => {
        if (!postId || !isAuthenticated) return;
        fetchComments();
    }, [postId, isAuthenticated, token]);

    const fetchComments = async () => {
        try {
            setLoading(true);
            const response = await commentsAPI.getPostComments(postId);
            const fetchedComments = Array.isArray(response.data) ? response.data : [];
            setComments(fetchedComments);

            // Récupérer les informations des auteurs
            const authorIds = new Set();
            fetchedComments.forEach(comment => {
                authorIds.add(comment.authorId);
                if (comment.replies && Array.isArray(comment.replies)) {
                    comment.replies.forEach(reply => authorIds.add(reply.authorId));
                }
            });

            const authorsInfo = {};
            const authorPromises = Array.from(authorIds).map(async authorId => {
                try {
                    const authorInfo = await userAPI.getUserInfo(authorId);
                    if (authorInfo && authorInfo.data) {
                        authorsInfo[authorId] = authorInfo.data;
                    }
                } catch (error) {
                    console.error(`Error fetching author info for ID ${authorId}:`, error);
                }
            });

            await Promise.all(authorPromises);
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
            const userInfo = await userAPI.getUserInfo(userId);
            if (!userInfo) {
                throw new Error('Failed to fetch user information');
            }

            setAuthors(prevAuthors => ({
                ...prevAuthors,
                [userId]: userInfo
            }));

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

            await commentsAPI.createComment({
                content: newComment,
                authorId: userId,
                postId: postId
            });

            toast.success("Commentaire publié avec succès !");
            fetchComments();
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
            const userInfo = await userAPI.getUserInfo(userId);
            if (!userInfo) {
                throw new Error('Failed to fetch user information');
            }

            const response = await commentsAPI.addReply(commentId, {
                content: replyContent,
                authorId: userId,
                postId: postId
            });

            if (response.data) {
                setAuthors(prevAuthors => ({
                    ...prevAuthors,
                    [userId]: userInfo
                }));

                const newReply = {
                    id: response.data.id || `temp-reply-${Date.now()}`,
                    content: replyContent,
                    authorId: userId,
                    createdAt: response.data.createdAt || new Date().toISOString()
                };

                setComments(prevComments =>
                    prevComments.map(comment => {
                        if (comment.id === commentId) {
                            return {
                                ...comment,
                                replies: [...(comment.replies || []), newReply]
                            };
                        }
                        return comment;
                    })
                );

                toast.success("Réponse publiée avec succès !");
            }
        } catch (err) {
            console.error("Erreur lors de la création de la réponse :", err);
            toast.error(`Échec de la publication de la réponse : ${err.message}`);
            fetchComments();
        }
    };

    const handleEditComment = async (commentId, content) => {
        setEditingCommentId(commentId);
        setEditingCommentContent(content);
    };

    const handleUpdateComment = async () => {
        if (!editingCommentContent.trim()) {
            toast.error("Le contenu du commentaire ne peut pas être vide");
            return;
        }

        try {
            // Find the comment in the current comments list to ensure it exists
            const commentToUpdate = comments.find(c => c.id === editingCommentId) ||
                comments.find(c => c.replies?.some(r => r.id === editingCommentId));

            if (!commentToUpdate) {
                throw new Error('Comment not found');
            }

            const response = await commentsAPI.updateComment(editingCommentId, editingCommentContent);

            if (response.data) {
                setComments(prevComments =>
                    prevComments.map(comment => {
                        if (comment.id === editingCommentId) {
                            return { ...comment, content: editingCommentContent };
                        }
                        if (comment.replies) {
                            return {
                                ...comment,
                                replies: comment.replies.map(reply =>
                                    reply.id === editingCommentId
                                        ? { ...reply, content: editingCommentContent }
                                        : reply
                                )
                            };
                        }
                        return comment;
                    })
                );

                setEditingCommentId(null);
                setEditingCommentContent('');
                toast.success("Commentaire mis à jour avec succès !");
            } else {
                throw new Error('Failed to update comment');
            }
        } catch (err) {
            console.error("Erreur lors de la mise à jour du commentaire :", err);
            toast.error(`Échec de la mise à jour du commentaire : ${err.message}`);
            fetchComments(); // Refresh comments on error
        }
    };

    const handleDeleteComment = async (commentId) => {
        try {
            // Find the comment in the current comments list to ensure it exists
            const commentToDelete = comments.find(c => c.id === commentId) ||
                comments.find(c => c.replies?.some(r => r.id === commentId));

            if (!commentToDelete) {
                throw new Error('Comment not found');
            }

            const response = await commentsAPI.deleteComment(commentId);

            if (response.status === 200 || response.status === 204) {
                setComments(prevComments =>
                    prevComments.map(comment => {
                        if (comment.id === commentId) {
                            return null; // Remove the comment
                        }
                        if (comment.replies) {
                            return {
                                ...comment,
                                replies: comment.replies.filter(reply => reply.id !== commentId)
                            };
                        }
                        return comment;
                    }).filter(Boolean) // Remove null values
                );
                toast.success("Commentaire supprimé avec succès !");
            } else {
                throw new Error('Failed to delete comment');
            }
        } catch (err) {
            console.error("Erreur lors de la suppression du commentaire :", err);
            toast.error(`Échec de la suppression du commentaire : ${err.message}`);
            fetchComments(); // Refresh comments on error
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
                            onEditComment={handleEditComment}
                            onDeleteComment={handleDeleteComment}
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

            {editingCommentId && (
                <div className="edit-comment-form">
                    <textarea
                        value={editingCommentContent}
                        onChange={(e) => setEditingCommentContent(e.target.value)}
                        placeholder="Modifier le commentaire..."
                    />
                    <button onClick={handleUpdateComment} className="icon-button">
                        <FontAwesomeIcon icon={faPaperPlane} />
                    </button>
                </div>
            )}
        </div>
    );
};

export default Comment;