import React from 'react';
import CommentItem from './CommentItem';

const CommentsList = ({
  comments,
  userId,
  editingCommentId,
  editingCommentContent,
  onAddReply,
  onStartEdit,
  onCancelEdit,
  onUpdateComment,
  onUpdateReply,
  onDeleteComment,
  setEditingCommentContent
}) => {
  return (
    <>
      {comments.length > 0 ? (
        <ul className="comments-list">
          {comments.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              userId={userId}
              onAddReply={onAddReply}
              isEditing={editingCommentId === comment.id}
              onStartEdit={onStartEdit}
              onCancelEdit={onCancelEdit}
              onUpdateComment={onUpdateComment}
              onEditReply={onUpdateReply}
              onDeleteReply={onDeleteComment}
              onDeleteComment={onDeleteComment}
              editingContent={editingCommentContent}
              onEditingContentChange={setEditingCommentContent}
            />
          ))}
        </ul>
      ) : (
        <p className="no-comments">Soyez le premier à réagir !</p>
      )}
    </>
  );
};

export default CommentsList;