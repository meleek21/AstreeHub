import { useState } from 'react';
import Reaction from './Reaction';
import Comment from './Comment';
import '../assets/Css/Post.css';

function Post({ post }) {
  const [showComments, setShowComments] = useState(false);

  return (
    <div className="post-container">
      <div className="post-header">
        <span className="post-author">{post.authorName || 'Utilisateur'}</span>
        <span className="post-timestamp">{new Date(post.createdAt).toLocaleString()}</span>
      </div>
      <div className="post-content">{post.content}</div>
      <Reaction postId={post.id} />
      <button onClick={() => setShowComments(!showComments)}>
        {showComments ? 'Masquer les commentaires' : 'Afficher les commentaires'}
      </button>
      {showComments && <Comment postId={post.id} />}
    </div>
  );
}

export default Post;