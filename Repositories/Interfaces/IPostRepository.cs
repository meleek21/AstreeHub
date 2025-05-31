using ASTREE_PFE.Models;

namespace ASTREE_PFE.Repositories.Interfaces
{
    public interface IPostRepository
    {
        public Task<(IEnumerable<Post>, string, bool)> GetAllAsync(
            string lastItemId = null,
            int limit = 10,
            PostType? postType = null
        );

        public Task<(IEnumerable<Post>, string, bool)> GetPostsByChannelIdAsync(
            string channelId,
            string lastItemId = null,
            int limit = 10
        );

        public Task<Post> GetByIdAsync(string id);

        public Task<(IEnumerable<Post>, string, bool)> GetByAuthorIdAsync(
            string authorId,
            string lastItemId = null,
            int limit = 10,
            PostType? postType = null
        );

        public Task CreateAsync(Post post);

        public Task UpdateAsync(string id, Post post);
        public Task DeleteAsync(string id);

        public Task AddFileIdsAsync(string postId, List<string> fileIds);

        public Task RemoveFileIdsAsync(string postId, List<string> fileIds);
    }
}
