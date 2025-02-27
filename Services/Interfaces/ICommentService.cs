using ASTREE_PFE.Models;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace ASTREE_PFE.Services.Interfaces
{
    public interface ICommentService
    {
        Task<IEnumerable<Comment>> GetAllCommentsAsync();
        Task<Comment> GetCommentByIdAsync(string id);
        Task<IEnumerable<Comment>> GetCommentsByPostAsync(int postId);
        Task<IEnumerable<Comment>> GetCommentsByAuthorAsync(string authorId);
        Task<Comment> CreateCommentAsync(Comment comment);
        Task UpdateCommentAsync(string id, Comment comment);
        Task DeleteCommentAsync(string id);
        Task AddReplyAsync(string commentId, Comment reply);
        Task UpdateReactionsAsync(string commentId, Dictionary<ReactionType, int> reactions);
    }
}