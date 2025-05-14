
using ASTREE_PFE.Models;
using ASTREE_PFE.Repositories.Interfaces;
using MongoDB.Driver;

namespace ASTREE_PFE.Repositories
{
    public class PostRepository : IPostRepository
    {
        private readonly IMongoCollection<Post> _posts;

        public IMongoCollection<Post> Collection => _posts;

        public PostRepository(IMongoDatabase database)
        {
            _posts = database.GetCollection<Post>("Posts");
        }

        public async Task<(
            IEnumerable<Post> Posts,
            string NextLastItemId,
            bool HasMore
        )> GetAllAsync(string lastItemId = null, int limit = 10)
        {
            var filterBuilder = Builders<Post>.Filter;
            var filter = filterBuilder.And(
                filterBuilder.Eq(p => p.ChannelId, null),
                filterBuilder.Eq(p => p.IsLibraryPost, false)
            );

            if (!string.IsNullOrEmpty(lastItemId))
            {
                var lastPost = await _posts.Find(p => p.Id == lastItemId).FirstOrDefaultAsync();
                if (lastPost != null)
                {
                    filter = filterBuilder.And(
                        filter,
                        filterBuilder.Lt(p => p.Timestamp, lastPost.Timestamp)
                    );
                }
            }

            var query = _posts.Find(filter);

            var sortedQuery = query.SortByDescending(p => p.Timestamp);
            var posts = await sortedQuery.Limit(limit + 1).ToListAsync();

            bool hasMore = posts.Count > limit;
            var resultPosts = hasMore ? posts.Take(limit) : posts;
            string nextLastItemId = hasMore ? posts[limit - 1].Id : null;

            return (resultPosts, nextLastItemId, hasMore);
        }

        public async Task<(
            IEnumerable<Post> Posts,
            string NextLastItemId,
            bool HasMore
        )> GetPostsByChannelIdAsync(string channelId, string lastItemId = null, int limit = 10)
        {
            var filterBuilder = Builders<Post>.Filter;
            var filter = filterBuilder.Eq(p => p.ChannelId, channelId);

            if (!string.IsNullOrEmpty(lastItemId))
            {
                var lastPost = await _posts.Find(p => p.Id == lastItemId).FirstOrDefaultAsync();
                if (lastPost != null)
                {
                    filter = filterBuilder.And(
                        filter,
                        filterBuilder.Lt(p => p.Timestamp, lastPost.Timestamp)
                    );
                }
            }

            var query = _posts.Find(filter);

            var sortedQuery = query.SortByDescending(p => p.Timestamp);
            var posts = await sortedQuery.Limit(limit + 1).ToListAsync();

            bool hasMore = posts.Count > limit;
            var resultPosts = hasMore ? posts.Take(limit) : posts;
            string nextLastItemId = hasMore ? posts[limit - 1].Id : null;

            return (resultPosts, nextLastItemId, hasMore);
        }

public async Task<(IEnumerable<Post> Posts, string NextLastItemId, bool HasMore)> GetLibraryPostsAsync(string lastItemId = null, int limit = 10)
{
    var filterBuilder = Builders<Post>.Filter;
    var filter = filterBuilder.Eq(p => p.IsLibraryPost, true);

    if (!string.IsNullOrEmpty(lastItemId))
    {
        var lastPost = await _posts.Find(p => p.Id == lastItemId).FirstOrDefaultAsync();
        if (lastPost != null)
        {
            filter = filterBuilder.And(
                filter,
                filterBuilder.Lt(p => p.Timestamp, lastPost.Timestamp)
            );
        }
    }

    var query = _posts.Find(filter);
    var sortedQuery = query.SortByDescending(p => p.Timestamp);
    var posts = await sortedQuery.Limit(limit + 1).ToListAsync();

    bool hasMore = posts.Count > limit;
    var resultPosts = hasMore ? posts.Take(limit) : posts;
    string nextLastItemId = hasMore ? posts[limit - 1].Id : null;

    return (resultPosts, nextLastItemId, hasMore);
}

        public async Task<Post> GetByIdAsync(string id)
        {
            return await _posts.Find(p => p.Id == id).FirstOrDefaultAsync();
        }

        public async Task<(
            IEnumerable<Post> Posts,
            string NextLastItemId,
            bool HasMore
        )> GetByAuthorIdAsync(string authorId, string lastItemId = null, int limit = 10)
        {
            var filterBuilder = Builders<Post>.Filter;
            var filter = filterBuilder.Eq(p => p.AuthorId, authorId);

            if (!string.IsNullOrEmpty(lastItemId))
            {
                var lastPost = await _posts.Find(p => p.Id == lastItemId).FirstOrDefaultAsync();
                if (lastPost != null)
                {
                    filter = filterBuilder.And(
                        filter,
                        filterBuilder.Lt(p => p.Timestamp, lastPost.Timestamp)
                    );
                }
            }

            var query = _posts.Find(filter);

            var sortedQuery = query.SortByDescending(p => p.Timestamp);
            var posts = await sortedQuery.Limit(limit + 1).ToListAsync();

            bool hasMore = posts.Count > limit;
            var resultPosts = hasMore ? posts.Take(limit) : posts;
            string nextLastItemId = hasMore ? posts[limit - 1].Id : null;

            return (resultPosts, nextLastItemId, hasMore);
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

        public async Task AddCommentAsync(string postId, Comment comment)
        {
            var filter = Builders<Post>.Filter.Eq(p => p.Id, postId);
            var update = Builders<Post>.Update.Push(p => p.Comments, comment);
            await _posts.UpdateOneAsync(filter, update);
        }

        public async Task RemoveCommentAsync(string postId, string commentId)
        {
            var filter = Builders<Post>.Filter.Eq(p => p.Id, postId);
            var update = Builders<Post>.Update.PullFilter(p => p.Comments, c => c.Id == commentId);
            await _posts.UpdateOneAsync(filter, update);
        }

        public async Task UpdateReactionsAsync(
            string postId,
            Dictionary<ReactionType, int> reactions
        )
        {
            var filter = Builders<Post>.Filter.Eq(p => p.Id, postId);
            var update = Builders<Post>.Update.Set(p => p.ReactionCounts, reactions);
            await _posts.UpdateOneAsync(filter, update);
        }

        public async Task<IEnumerable<Post>> GetRecentPostsAsync(int count)
        {
            return await _posts
                .Find(_ => true)
                .SortByDescending(p => p.Timestamp)
                .Limit(count)
                .ToListAsync();
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
