using ASTREE_PFE.Models;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace ASTREE_PFE.Services.Interfaces
{
    public interface ICommentService
    {
        Task<IEnumerable<Comment>> GetAllCommentsAsync();
        Task<Comment> GetCommentByIdAsync(string id);
        Task<IEnumerable<Comment>> GetCommentsByAuthorAsync(string authorId);
        Task<IEnumerable<Comment>> GetCommentsByPostAsync(string postId);
        Task<Comment> CreateCommentAsync(Comment comment);
        Task UpdateCommentAsync(string id, Comment comment);
        Task DeleteCommentAsync(string id);
        Task AddReplyAsync(string commentId, Comment reply);
        Task UpdateReplyAsync(string commentId, string replyId, Comment updatedReply);
        Task DeleteReplyAsync(string commentId, string replyId);
    }
}