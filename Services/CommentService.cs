using ASTREE_PFE.Models;
using ASTREE_PFE.Repositories;
using ASTREE_PFE.Services.Interfaces;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace ASTREE_PFE.Services
{
    public class CommentService : ICommentService
    {
        private readonly ICommentRepository _commentRepository;

        public CommentService(ICommentRepository commentRepository)
        {
            _commentRepository = commentRepository;
        }

        public async Task<IEnumerable<Comment>> GetAllCommentsAsync()
        {
            return await _commentRepository.GetAllAsync();
        }

        public async Task<Comment> GetCommentByIdAsync(string id)
        {
            return await _commentRepository.GetByIdAsync(id);
        }

        public async Task<IEnumerable<Comment>> GetCommentsByPostAsync(int postId)
        {
            return await _commentRepository.GetCommentsByPostAsync(postId);
        }

        public async Task<IEnumerable<Comment>> GetCommentsByAuthorAsync(string authorId)
        {
            return await _commentRepository.GetCommentsByAuthorAsync(authorId);
        }

        public async Task<Comment> CreateCommentAsync(Comment comment)
        {
            await _commentRepository.CreateAsync(comment);
            return comment;
        }

        public async Task UpdateCommentAsync(string id, Comment comment)
        {
            await _commentRepository.UpdateAsync(id, comment);
        }

        public async Task DeleteCommentAsync(string id)
        {
            await _commentRepository.DeleteAsync(id);
        }

        public async Task AddReplyAsync(string commentId, Comment reply)
        {
            await _commentRepository.AddReplyAsync(commentId, reply);
        }

        public async Task UpdateReactionsAsync(string commentId, Dictionary<ReactionType, int> reactions)
        {
            await _commentRepository.UpdateReactionsAsync(commentId, reactions);
        }
    }
}