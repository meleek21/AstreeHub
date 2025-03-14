using ASTREE_PFE.Models;
using ASTREE_PFE.Repositories.Interfaces;
using MongoDB.Driver;
using System.Collections.Generic;
using System.Threading.Tasks;

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

        public async Task<IEnumerable<Post>> GetAllAsync()
        {
            return await _posts.Find(_ => true).ToListAsync();
        }

        public async Task<Post> GetByIdAsync(string id)
        {
            return await _posts.Find(p => p.Id == id).FirstOrDefaultAsync();
        }

        public async Task<IEnumerable<Post>> GetByAuthorIdAsync(string authorId)
        {
            return await _posts.Find(p => p.AuthorId == authorId).ToListAsync();
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

        public async Task UpdateReactionsAsync(string postId, Dictionary<ReactionType, int> reactions)
        {
            var filter = Builders<Post>.Filter.Eq(p => p.Id, postId);
            var update = Builders<Post>.Update.Set(p => p.Reactions, reactions);
            await _posts.UpdateOneAsync(filter, update);
        }

        public async Task<IEnumerable<Post>> GetRecentPostsAsync(int count)
        {
            return await _posts.Find(_ => true)
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