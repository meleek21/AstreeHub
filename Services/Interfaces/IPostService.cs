
using ASTREE_PFE.Models;

namespace ASTREE_PFE.Services.Interfaces
{
    public interface IPostService
    {
        public  Task<(IEnumerable<Post>, string, bool)> GetAllPostsAsync(
            string lastItemId = null,
            int limit = 10,
            PostType? postType = null);

        public  Task<Post> GetPostByIdAsync(string id);

        public Task<(IEnumerable<Post>, string, bool)> GetPostsByAuthorAsync(
            string authorId,
            string lastItemId = null,
            int limit = 10);

        public Task<(IEnumerable<Post>, string, bool)> GetPostsByChannelIdAsync(
            string channelId,
            string lastItemId = null,
            int limit = 10);

        public Task<(IEnumerable<Post>, string, bool)> GetLibraryPostsAsync(
            string lastItemId = null,
            int limit = 10);

        public Task<Post> CreatePostAsync(Post post);
        public Task UpdatePostAsync(string id, Post post);
        public Task DeletePostAsync(string id);

    }
}
