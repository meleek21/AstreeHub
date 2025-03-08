import React, { useState, useEffect } from 'react';
import axios from 'axios';
import signalRService from '../services/signalRService';
import '../assets/Css/Comment.css';

const API_BASE_URL = 'http://localhost:5126/api';

// Helper function to get auth token
const getAuthToken = (token) => {
    return token || localStorage.getItem('token');
};

// Helper function for API requests with auth
const authRequest = async (url, method = 'get', data = null, token) => {
    const authToken = getAuthToken(token);
    
    if (!authToken) {
        throw new Error("No authentication token available");
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

// Fetch author info
const fetchAuthorInfo = async (authorId, token) => {
    try {
        const response = await authRequest(`/employee/user-info/${authorId}`, 'get', null, token);
        return response.data;
    } catch (err) {
        console.error(`Error fetching author info for ${authorId}:`, err);
        return null;
    }
};

// CommentItem component
const CommentItem = ({ comment, authors, userId, onAddReply }) => {
    const [newReply, setNewReply] = useState('');

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
                    By {authors[comment.authorId] ? `${authors[comment.authorId].firstName} ${authors[comment.authorId].lastName}` : "Unknown User"} on {new Date(comment.createdAt || comment.timestamp).toLocaleString()}
                </small>
            </div>
            
            {/* Reply form */}
            <div className="reply-form">
                <input
                    type="text"
                    value={newReply}
                    onChange={handleReplyChange}
                    placeholder="Write a reply..."
                />
                <button onClick={handleReplySubmit}>Reply</button>
            </div>
            
            {/* Replies list */}
            {comment.replies && comment.replies.length > 0 && (
                <ul className="replies-list">
                    {comment.replies.map((reply) => (
                        <li key={reply.id} className="reply-item">
                            <p>{reply.content}</p>
                            <small>
                                By {authors[reply.authorId] ? `${authors[reply.authorId].firstName} ${authors[reply.authorId].lastName}` : "Unknown User"} on {new Date(reply.createdAt || reply.timestamp).toLocaleString()}
                            </small>
                        </li>
                    ))}
                </ul>
            )}
        </li>
    );
};

// Main Comment component
const Comment = ({ postId, userId, isAuthenticated, token }) => {
    const [comments, setComments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [authors, setAuthors] = useState({});
    const [newComment, setNewComment] = useState('');

    useEffect(() => {
        console.log('Comment component props:', { postId, isAuthenticated, tokenReceived: !!token });
    }, [postId, isAuthenticated, token]);

    const fetchComments = async () => {
        try {
            setLoading(true);
            console.log("Fetching comments for postId:", postId);
            
            const response = await authRequest(`/comment/post/${postId}`, 'get', null, token);
            
            console.log('Comments API response:', response);
            const fetchedComments = Array.isArray(response.data) ? response.data : [];
            setComments(fetchedComments);
            
            // Collect unique author IDs
            const authorIds = new Set();
            fetchedComments.forEach(comment => {
                authorIds.add(comment.authorId);
                if (comment.replies) {
                    comment.replies.forEach(reply => authorIds.add(reply.authorId));
                }
            });
            
            // Fetch author info for each unique author
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
            console.error("Error fetching comments:", err);
            
            if (err.response) {
                console.error("Error status:", err.response.status);
                console.error("Error data:", err.response.data);
                
                // Handle specific error cases
                if (err.response.status === 401) {
                    setError("Authentication failed. Please log in again.");
                    // Optional: Trigger a re-authentication flow
                    window.dispatchEvent(new CustomEvent('authError'));
                } else {
                    setError(`Failed to fetch comments: ${err.response.data?.message || err.message}`);
                }
            } else {
                setError(`Failed to fetch comments: ${err.message}`);
            }
            
            setLoading(false);
        }
    };

    // Set up SignalR event listeners for real-time updates
    useEffect(() => {
        if (!postId) return;
        
        // Function to handle new comments
        const onNewComment = (comment) => {
            if (comment.postId === postId) {
                console.log('New comment received via SignalR for this post:', comment);
                // Force immediate refresh instead of waiting for the next render cycle
                setTimeout(() => fetchComments(), 0); // Refresh comments when a new one is added
            }
        };
        
        // Function to handle updated comments
        const onUpdatedComment = (comment) => {
            if (comment.postId === postId) {
                console.log('Updated comment received via SignalR for this post:', comment);
                // Force immediate refresh instead of waiting for the next render cycle
                setTimeout(() => fetchComments(), 0); // Refresh comments when one is updated
            }
        };
        
        // Function to handle deleted comments
        const onDeletedComment = (commentId) => {
            console.log('Deleted comment received via SignalR:', commentId);
            // Force immediate refresh instead of waiting for the next render cycle
            setTimeout(() => fetchComments(), 0); // Refresh comments when one is deleted
        };
        
        // Function to handle new replies
        const onNewReply = (reply, parentCommentId) => {
            if (reply.postId === postId) {
                console.log('New reply received via SignalR for this post:', reply);
                // Force immediate refresh instead of waiting for the next render cycle
                setTimeout(() => fetchComments(), 0); // Refresh comments when a new reply is added
            }
        };
        
        // Register event handlers
        signalRService.onNewComment(onNewComment);
        signalRService.onUpdatedComment(onUpdatedComment);
        signalRService.onDeletedComment(onDeletedComment);
        signalRService.onNewReply(onNewReply);
        
        // Clean up event handlers on unmount
        return () => {
            signalRService.onNewComment(null);
            signalRService.onUpdatedComment(null);
            signalRService.onDeletedComment(null);
            signalRService.onNewReply(null);
        };
    }, [postId]);

    useEffect(() => {
        if (!postId) {
            setError("No post ID provided");
            setLoading(false);
            return;
        }
        
        if (!isAuthenticated) {
            setError("User is not authenticated. Please log in.");
            setLoading(false);
            return;
        }
        
        let isMounted = true;
        
        const loadComments = async () => {
            if (isMounted) {
                await fetchComments();
            }
        };
        
        loadComments();
        
        return () => {
            isMounted = false;
        };
    }, [postId, isAuthenticated, token]);

    const handleCreateComment = async () => {
        if (!newComment.trim()) {
            setError("Comment content cannot be empty");
            return;
        }
        
        try {
            setError(null);
            // Optimistically add the comment to the UI
            const optimisticComment = {
                id: `temp-${Date.now()}`,
                content: newComment,
                authorId: userId,
                postId: postId,
                createdAt: new Date().toISOString(),
                replies: []
            };
            
            // Add the optimistic comment to the list
            setComments(prevComments => [optimisticComment, ...prevComments]);
            setNewComment(''); // Clear the input field immediately
            
            // Send the request to the server
            await authRequest('/comment', 'post', {
                content: newComment,
                authorId: userId,
                postId: postId
            }, token);
            
            // SignalR will handle the update, but we'll fetch as a fallback
            console.log('Comment sent to server, waiting for SignalR update');
            
            // Refresh comments after a short delay if SignalR doesn't update
            setTimeout(() => {
                fetchComments();
            }, 1000);
        } catch (err) {
            console.error("Error creating comment:", err);
            setError(`Failed to create comment: ${err.response?.data?.message || err.message}`);
            // Refresh to get the correct state
            fetchComments();
        }
    };

    const handleAddReply = async (commentId, replyContent) => {
        if (!replyContent.trim()) {
            setError("Reply content cannot be empty");
            return;
        }
        
        try {
            setError(null);
            // Optimistically add the reply to the UI
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
            
            // Send the request to the server
            await authRequest(`/comment/${commentId}/reply`, 'post', {
                content: replyContent,
                authorId: userId,
                postId: postId
            }, token);
            
            // SignalR will handle the update, but we'll fetch as a fallback
            console.log('Reply sent to server, waiting for SignalR update');
            
            // Refresh comments after a short delay if SignalR doesn't update
            setTimeout(() => {
                fetchComments();
            }, 1000);
        } catch (err) {
            console.error("Error adding reply:", err);
            setError(`Failed to add reply: ${err.response?.data?.message || err.message}`);
            // Refresh to get the correct state
            fetchComments();
        }
    };

    if (loading) return <div>Loading comments...</div>;
    
    return (
        <div className="comment-section">
            <p>Comments</p>
            
            {error && <div className="error-message">{error}</div>}
            
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
                <p>No comments yet. Be the first to comment!</p>
            )}
            
            <div className="comment-form">
                <textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Write a comment..."
                />
                <button onClick={handleCreateComment}>Post Comment</button>
            </div>
        </div>
    );
};

export default Comment;