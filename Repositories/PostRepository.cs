using ASTREE_PFE.Models;
using ASTREE_PFE.Repositories.Interfaces;
using MongoDB.Driver;

namespace ASTREE_PFE.Repositories
{
    public class PostRepository : IPostRepository
    {
        private readonly IMongoCollection<Post> _posts;

        public PostRepository(IMongoDatabase database)
        {
            _posts = database.GetCollection<Post>("Posts");
        }

        public async Task<(IEnumerable<Post>, string, bool)> GetAllAsync(
            string lastItemId = null,
            int limit = 10,
            PostType? postType = null
        )
        {
            var filterBuilder = Builders<Post>.Filter;
            var filter = postType.HasValue
                ? filterBuilder.Eq(p => p.PostType, postType.Value)
                : filterBuilder.Empty;

            // Pagination
            if (!string.IsNullOrEmpty(lastItemId))
            {
                var lastPost = await _posts.Find(p => p.Id == lastItemId).FirstOrDefaultAsync();
                if (lastPost != null)
                {
                    filter &= filterBuilder.Lt(p => p.Timestamp, lastPost.Timestamp);
                }
            }

            var query = _posts.Find(filter).SortByDescending(p => p.Timestamp).Limit(limit + 1);

            var posts = await query.ToListAsync();
            bool hasMore = posts.Count > limit;

            return (
                hasMore ? posts.Take(limit) : posts,
                hasMore ? posts[limit - 1].Id : null,
                hasMore
            );
        }

        public async Task<(IEnumerable<Post>, string, bool)> GetPostsByChannelIdAsync(
            string channelId,
            string lastItemId = null,
            int limit = 10
        )
        {
            // Create a filter that matches both the channel ID and Channel post type
            var filterBuilder = Builders<Post>.Filter;
            var filter = filterBuilder.And(
                filterBuilder.Eq(p => p.ChannelId, channelId),
                filterBuilder.Eq(p => p.PostType, PostType.Channel)
            );

            if (!string.IsNullOrEmpty(lastItemId))
            {
                var lastPost = await _posts.Find(p => p.Id == lastItemId).FirstOrDefaultAsync();
                if (lastPost != null)
                {
                    filter &= filterBuilder.Lt(p => p.Timestamp, lastPost.Timestamp);
                }
            }

            var posts = await _posts
                .Find(filter)
                .SortByDescending(p => p.Timestamp)
                .Limit(limit + 1)
                .ToListAsync();

            bool hasMore = posts.Count > limit;
            return (
                hasMore ? posts.Take(limit) : posts,
                hasMore ? posts[limit - 1].Id : null,
                hasMore
            );
        }

        public async Task<Post> GetByIdAsync(string id)
        {
            return await _posts.Find(p => p.Id == id).FirstOrDefaultAsync();
        }

        public async Task<(IEnumerable<Post>, string, bool)> GetByAuthorIdAsync(
            string authorId,
            string lastItemId = null,
            int limit = 10,
            PostType? postType = null // Add this parameter
        )
        {
            var filterBuilder = Builders<Post>.Filter;
            var filter = filterBuilder.Eq(p => p.AuthorId, authorId);

            // Add postType filter if specified
            if (postType.HasValue)
            {
                filter &= filterBuilder.Eq(p => p.PostType, postType.Value);
            }

            if (!string.IsNullOrEmpty(lastItemId))
            {
                var lastPost = await _posts.Find(p => p.Id == lastItemId).FirstOrDefaultAsync();
                if (lastPost != null)
                {
                    filter &= filterBuilder.Lt(p => p.Timestamp, lastPost.Timestamp);
                }
            }

            var posts = await _posts
                .Find(filter)
                .SortByDescending(p => p.Timestamp)
                .Limit(limit + 1)
                .ToListAsync();

            bool hasMore = posts.Count > limit;
            return (
                hasMore ? posts.Take(limit) : posts,
                hasMore ? posts[limit - 1].Id : null,
                hasMore
            );
        }

        public async Task CreateAsync(Post post)
        {
            await _posts.InsertOneAsync(post);
        }

        public async Task UpdateAsync(string id, Post post)
        {
            await _posts.ReplaceOneAsync(p => p.Id == id, post);
        }

        public async Task DeleteAsync(string id)
        {
            await _posts.DeleteOneAsync(p => p.Id == id);
        }

        public async Task AddFileIdsAsync(string postId, List<string> fileIds)
        {
            var filter = Builders<Post>.Filter.Eq(p => p.Id, postId);
            var update = Builders<Post>.Update.PushEach(p => p.FileIds, fileIds);
            await _posts.UpdateOneAsync(filter, update);
        }

        public async Task RemoveFileIdsAsync(string postId, List<string> fileIds)
        {
            var filter = Builders<Post>.Filter.Eq(p => p.Id, postId);
            var update = Builders<Post>.Update.PullAll(p => p.FileIds, fileIds);
            await _posts.UpdateOneAsync(filter, update);
        }
    }
}
