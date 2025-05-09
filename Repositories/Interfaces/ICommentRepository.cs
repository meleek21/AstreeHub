
using ASTREE_PFE.Models;

namespace ASTREE_PFE.Repositories.Interfaces
{
    public interface ICommentRepository
    {
        Task<IEnumerable<Comment>> GetAllAsync();
        Task<Comment> GetByIdAsync(string id);
        Task<IEnumerable<Comment>> GetByPostIdAsync(string postId);
        Task<IEnumerable<Comment>> GetByAuthorIdAsync(string authorId);
        Task CreateAsync(Comment comment);
        Task UpdateAsync(string id, Comment comment);
        Task DeleteAsync(string id);
        Task AddReplyAsync(string commentId, Comment reply);
        Task UpdateReplyAsync(string commentId, string replyId, Comment updatedReply);
        Task DeleteReplyAsync(string commentId, string replyId);
    }
}
