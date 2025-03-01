using ASTREE_PFE.Models;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace ASTREE_PFE.Repositories.Interfaces
{
    public interface IPostRepository
    {
        Task<IEnumerable<Post>> GetAllAsync();
        Task<Post> GetByIdAsync(string id);
        Task<IEnumerable<Post>> GetByAuthorIdAsync(string authorId);
        Task CreateAsync(Post post);
        Task UpdateAsync(string id, Post post);
        Task DeleteAsync(string id);
        Task AddCommentAsync(string postId, Comment comment);
        Task RemoveCommentAsync(string postId, string commentId);
        Task UpdateReactionsAsync(string postId, Dictionary<ReactionType, int> reactions);
        Task<IEnumerable<Post>> GetRecentPostsAsync(int count);
    }
}