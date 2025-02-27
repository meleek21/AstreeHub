using ASTREE_PFE.Models;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace ASTREE_PFE.Repositories
{
    public interface ICommentRepository : IMongoRepository<Comment>
    {
        Task<IEnumerable<Comment>> GetCommentsByPostAsync(int postId);
        Task<IEnumerable<Comment>> GetCommentsByAuthorAsync(string authorId);
        Task AddReplyAsync(string commentId, Comment reply);
        Task UpdateReactionsAsync(string commentId, Dictionary<ReactionType, int> reactions);
    }
}