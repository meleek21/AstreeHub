using ASTREE_PFE.Models;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace ASTREE_PFE.Repositories
{
    public interface IPostRepository : IMongoRepository<Post>
    {
        Task<IEnumerable<Post>> GetPostsByAuthorAsync(string authorId);
        Task<IEnumerable<Post>> GetPostsByChannelAsync(int channelId);
        Task AddCommentAsync(string postId, Comment comment);
        Task UpdateReactionsAsync(string postId, Dictionary<ReactionType, int> reactions);
        Task<IEnumerable<Post>> GetRecentPostsAsync(int count);
    }
}