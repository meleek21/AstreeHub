using ASTREE_PFE.Models;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace ASTREE_PFE.Repositories.Interfaces
{
    public interface IPostRepository
    {
        // Get all posts with cursor-based pagination
        Task<(IEnumerable<Post> Posts, string NextLastItemId, bool HasMore)> GetAllAsync(string lastItemId = null, int limit = 10);

        // Get all posts by channel ID with pagination
        Task<(IEnumerable<Post> Posts, string NextLastItemId, bool HasMore)> GetPostsByChannelIdAsync(string channelId, string lastItemId = null, int limit = 10);

        // Get a post by its ID
        Task<Post> GetByIdAsync(string id);

        // Get all posts by a specific author ID
        Task<IEnumerable<Post>> GetByAuthorIdAsync(string authorId);

        // Create a new post
        Task CreateAsync(Post post);

        // Update an existing post by ID
        Task UpdateAsync(string id, Post post);

        // Delete a post by ID
        Task DeleteAsync(string id);

        // Add a comment to a post
        Task AddCommentAsync(string postId, Comment comment);

        // Remove a comment from a post
        Task RemoveCommentAsync(string postId, string commentId);

        // Update reactions for a post
        Task UpdateReactionsAsync(string postId, Dictionary<ReactionType, int> reactions);

        // Get the most recent posts (limited by count)
        Task<IEnumerable<Post>> GetRecentPostsAsync(int count);

        // Add file IDs to a post
        Task AddFileIdsAsync(string postId, List<string> fileIds);

        // Remove file IDs from a post
        Task RemoveFileIdsAsync(string postId, List<string> fileIds);
    }
}