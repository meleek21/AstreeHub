using ASTREE_PFE.Models;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace ASTREE_PFE.Services.Interfaces
{
    public interface IPostService
    {
        Task DecrementReactionCountAsync(string postId, ReactionType reactionType);
        Task UpdateReactionCountAsync(string postId, ReactionType oldType, ReactionType newType);
        Task IncrementReactionCountAsync(string postId, ReactionType type);
        Task<IEnumerable<Post>> GetAllPostsAsync();
        Task<Post> GetPostByIdAsync(string id);
        Task<IEnumerable<Post>> GetPostsByAuthorAsync(string authorId);
        Task<Post> CreatePostAsync(Post post);
        Task UpdatePostAsync(string id, Post post);
        Task DeletePostAsync(string id);
        Task AddCommentAsync(string postId, Comment comment);
        Task UpdateReactionsAsync(string postId);
    }
}