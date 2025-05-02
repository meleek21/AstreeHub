import React, { useState, useEffect } from 'react';
import { commentsAPI } from '../../services/apiServices';
import toast, { Toaster } from 'react-hot-toast';
import CommentForm from './CommentForm';
import CommentsList from './CommentsList';

const Comment = ({ postId, userId, isAuthenticated, token }) => {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
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
      setLoading(false);
    } catch (err) {
      console.error("Erreur lors de la récupération des commentaires :", err);
      toast.error(`Échec de la récupération des commentaires : ${err.message}`);
      setLoading(false);
    }
  };

  const handleCreateComment = async (newComment) => {
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
      setComments(prevComments => prevComments.filter(c => c.id !== `temp-${Date.now()}`));
    }
  };

  const handleAddReply = async (commentId, replyContent) => {
    try {
      const optimisticReply = {
        id: `temp-reply-${Date.now()}`,
        content: replyContent,
        authorId: userId,
        createdAt: new Date().toISOString()
      };

      setComments(prevComments =>
        prevComments.map(comment => {
          if (comment.id === commentId) {
            return {
              ...comment,
              replies: [...(comment.replies || []), optimisticReply]
            };
          }
          return comment;
        })
      );

      const response = await commentsAPI.addReply(commentId, {
        content: replyContent,
        authorId: userId,
        postId: postId
      });

      if (response.data) {
        setComments(prevComments =>
          prevComments.map(comment => {
            if (comment.id === commentId) {
              return {
                ...comment,
                replies: comment.replies.map(reply => 
                  reply.id === optimisticReply.id ? response.data : reply
                )
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
      setComments(prevComments =>
        prevComments.map(comment => {
          if (comment.id === commentId) {
            return {
              ...comment,
              replies: comment.replies.filter(reply => reply.id !== `temp-reply-${Date.now()}`)
            };
          }
          return comment;
        })
      );
    }
  };

  const handleStartEdit = (commentId, content) => {
    setEditingCommentId(commentId);
    setEditingCommentContent(content);
  };

  const handleCancelEdit = () => {
    setEditingCommentId(null);
    setEditingCommentContent('');
  };

  const handleUpdateComment = async () => {
    if (!editingCommentContent.trim()) {
      toast.error("Le contenu du commentaire ne peut pas être vide");
      return;
    }

    try {
      await commentsAPI.updateComment(editingCommentId, editingCommentContent);

      setComments(prevComments =>
        prevComments.map(comment => {
          if (comment.id === editingCommentId) {
            return { ...comment, content: editingCommentContent };
          }
          return comment;
        })
      );

      setEditingCommentId(null);
      setEditingCommentContent('');
      toast.success("Commentaire mis à jour avec succès !");
    } catch (err) {
      console.error("Erreur lors de la mise à jour du commentaire :", err);
      toast.error(`Échec de la mise à jour du commentaire : ${err.message}`);
    }
  };

  const handleUpdateReply = async (commentId, replyId, content) => {
    if (!content.trim()) {
      toast.error("Le contenu de la réponse ne peut pas être vide");
      return;
    }

    try {
      await commentsAPI.updateReply(commentId, replyId, content);

      setComments(prevComments =>
        prevComments.map(comment => {
          if (comment.id === commentId) {
            return {
              ...comment,
              replies: comment.replies.map(reply => 
                reply.id === replyId ? { ...reply, content } : reply
              )
            };
          }
          return comment;
        })
      );
      toast.success("Réponse mise à jour avec succès !");
    } catch (err) {
      console.error("Erreur lors de la mise à jour de la réponse :", err);
      toast.error(`Échec de la mise à jour de la réponse : ${err.message}`);
    }
  };

  const handleDeleteComment = async (commentId, replyId = null) => {
    try {
      if (replyId) {
        await commentsAPI.deleteReply(commentId, replyId);
        setComments(prevComments =>
          prevComments.map(comment => {
            if (comment.id === commentId) {
              return {
                ...comment,
                replies: comment.replies.filter(reply => reply.id !== replyId)
              };
            }
            return comment;
          })
        );
        toast.success("Réponse supprimée avec succès !");
      } else {
        await commentsAPI.deleteComment(commentId);
        setComments(prevComments => prevComments.filter(comment => comment.id !== commentId));
        toast.success("Commentaire supprimé avec succès !");
      }
    } catch (err) {
      console.error("Erreur lors de la suppression :", err);
      toast.error(`Échec de la suppression : ${err.message}`);
    }
  };

  if (loading) return <div className="loading">Chargement des commentaires...</div>;

  return (
    <div className="comment-section">
      <Toaster position="top-right" />
      <h3 className="comment-title">Commentaires</h3>
      
      <CommentsList
        comments={comments}
        userId={userId}
        editingCommentId={editingCommentId}
        editingCommentContent={editingCommentContent}
        onAddReply={handleAddReply}
        onStartEdit={handleStartEdit}
        onCancelEdit={handleCancelEdit}
        onUpdateComment={handleUpdateComment}
        onUpdateReply={handleUpdateReply}
        onDeleteComment={handleDeleteComment}
        setEditingCommentContent={setEditingCommentContent}
      />
      {isAuthenticated && (
        <CommentForm 
          onCreateComment={handleCreateComment} 
        />
      )}
    </div>
  );
};

export default Comment;