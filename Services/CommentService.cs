using ASTREE_PFE.Models;
using ASTREE_PFE.Repositories.Interfaces;
using ASTREE_PFE.Services.Interfaces;
using MongoDB.Bson;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace ASTREE_PFE.Services 
{
    public class CommentService : ICommentService
    {
        private readonly ICommentRepository _commentRepository;
        private readonly IPostRepository _postRepository;
        
        public CommentService(ICommentRepository commentRepository, IPostRepository postRepository)
        {
            _commentRepository = commentRepository;
            _postRepository = postRepository;
        }
        
        public async Task<IEnumerable<Comment>> GetAllCommentsAsync()
        {
            return await _commentRepository.GetAllAsync();
        }
        
        public async Task<IEnumerable<Comment>> GetCommentsByAuthorAsync(string authorId)
        {
            return await _commentRepository.GetByAuthorIdAsync(authorId);
        }
        
        public async Task<IEnumerable<Comment>> GetCommentsByPostAsync(string postId)
        {
            return await _commentRepository.GetByPostIdAsync(postId);
        }
        
        public async Task<Comment> GetCommentByIdAsync(string id)
        {
            return await _commentRepository.GetByIdAsync(id);
        }
        
        public async Task<Comment> CreateCommentAsync(Comment comment)
        {
            // Ensure the comment has an ObjectId before inserting
            if (string.IsNullOrEmpty(comment.Id))
            {
                comment.Id = ObjectId.GenerateNewId().ToString();
            }
            
            await _commentRepository.CreateAsync(comment);
            
            // Also add the comment to the post's Comments list
            await _postRepository.AddCommentAsync(comment.PostId, comment);
            
            return comment;
        }
        
        public async Task UpdateCommentAsync(string id, Comment comment)
        {
            await _commentRepository.UpdateAsync(id, comment);
        }
        
        public async Task DeleteCommentAsync(string id)
        {
            var comment = await _commentRepository.GetByIdAsync(id);
            if (comment != null)
            {
                await _commentRepository.DeleteAsync(id);
                
                // Remove comment from post
                await _postRepository.RemoveCommentAsync(comment.PostId, id);
            }
        }
        
        public async Task AddReplyAsync(string commentId, Comment reply)
        {
            // Ensure the reply has an ID
            if (string.IsNullOrEmpty(reply.Id))
            {
                reply.Id = ObjectId.GenerateNewId().ToString();
            }
            
            await _commentRepository.AddReplyAsync(commentId, reply);
        }
        

    }
}