import React, { useState, useEffect } from 'react';
import axios from 'axios';

const Comment = ({ postId, userId, isAuthenticated, token }) => {
    const [comments, setComments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [authors, setAuthors] = useState({});
    const [newComment, setNewComment] = useState('');
    const [newReply, setNewReply] = useState({});
    
    const API_BASE_URL = 'http://localhost:5126/api';
    
    // Debug: Log the props
    useEffect(() => {
        console.log('Comment component props:', { postId, isAuthenticated, tokenReceived: !!token });
    }, [postId, isAuthenticated, token]);
    
    // Helper function to get auth token
    const getAuthToken = () => {
        return token || localStorage.getItem('token');
    };
    
    // Helper function for API requests with auth
    const authRequest = async (url, method = 'get', data = null) => {
        const authToken = getAuthToken();
        
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
    const fetchAuthorInfo = async (authorId) => {
        try {
            const response = await authRequest(`/employee/user-info/${authorId}`);
            return response.data;
        } catch (err) {
            console.error(`Error fetching author info for ${authorId}:`, err);
            return null;
        }
    };
    
    // Fetch comments for the post
    const fetchComments = async () => {
        try {
            setLoading(true);
            console.log("Fetching comments for postId:", postId);
            
            const response = await authRequest(`/comment/post/${postId}`);
            
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
                const authorInfo = await fetchAuthorInfo(authorId);
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
    }, [postId, isAuthenticated]);
    
    // Display author information
    const getAuthorDisplay = (authorId) => {
        if (authors[authorId]) {
            const author = authors[authorId];
            return `${author.firstName} ${author.lastName}`;
        }
        return "Unknown User";
    };
    
    // Handle creating a new comment
    const handleCreateComment = async () => {
        if (!newComment.trim()) {
            setError("Comment content cannot be empty");
            return;
        }
        
        try {
            setError(null);
            const response = await authRequest('/comment', 'post', {
                content: newComment,
                authorId: userId,
                postId: postId
            });
            
            // Refresh comments to get the updated list with author info
            await fetchComments();
            setNewComment('');
        } catch (err) {
            console.error("Error creating comment:", err);
            setError(`Failed to create comment: ${err.response?.data?.message || err.message}`);
        }
    };
    
    // Handle adding a reply to a comment
    const handleAddReply = async (commentId) => {
        if (!newReply[commentId]?.trim()) {
            setError("Reply content cannot be empty");
            return;
        }
        
        try {
            setError(null);
            await authRequest(`/comment/${commentId}/reply`, 'post', {
                content: newReply[commentId],
                authorId: userId,
                postId: postId
            });
            
            // Refresh comments to get the updated list with author info
            await fetchComments();
            setNewReply({ ...newReply, [commentId]: '' });
        } catch (err) {
            console.error("Error adding reply:", err);
            setError(`Failed to add reply: ${err.response?.data?.message || err.message}`);
        }
    };
    
    if (loading) return <div>Loading comments...</div>;
    
    return (
        <div className="comment-section">
            <h3>Comments</h3>
            
            {error && <div className="error-message">{error}</div>}
            
            {comments.length > 0 ? (
                <ul className="comments-list">
                    {comments.map((comment) => (
                        <li key={comment.id} className="comment-item">
                            <div className="comment-content">
                                <p>{comment.content}</p>
                                <small>
                                    By {getAuthorDisplay(comment.authorId)} on {new Date(comment.createdAt || comment.timestamp).toLocaleString()}
                                </small>
                            </div>
                            
                            {/* Reply form */}
                            <div className="reply-form">
                                <input
                                    type="text"
                                    value={newReply[comment.id] || ''}
                                    onChange={(e) => setNewReply({ ...newReply, [comment.id]: e.target.value })}
                                    placeholder="Write a reply..."
                                />
                                <button onClick={() => handleAddReply(comment.id)}>Reply</button>
                            </div>
                            
                            {/* Replies list */}
                            {comment.replies && comment.replies.length > 0 && (
                                <ul className="replies-list">
                                    {comment.replies.map((reply) => (
                                        <li key={reply.id} className="reply-item">
                                            <p>{reply.content}</p>
                                            <small>
                                                By {getAuthorDisplay(reply.authorId)} on {new Date(reply.createdAt || reply.timestamp).toLocaleString()}
                                            </small>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </li>
                    ))}
                </ul>
            ) : (
                <p>No comments yet.</p>
            )}
            
            {/* New comment form */}
            <div className="new-comment-form">
                <input
                    type="text"
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