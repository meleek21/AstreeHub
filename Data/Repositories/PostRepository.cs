using ASTREE_PFE.Models;
using MongoDB.Driver;
using System.Linq.Expressions;

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

    public class PostRepository : MongoRepository<Post>, IPostRepository
{
    private readonly IMongoCollection<Post> _collection;

    public PostRepository(IMongoDatabase database) 
        : base(database, "Posts")
    {
        _collection = database.GetCollection<Post>("Posts");
    }

    public async Task<IEnumerable<Post>> GetPostsByAuthorAsync(string authorId)
    {
        var filter = Builders<Post>.Filter.Eq(p => p.AuthorId.ToString(), authorId);
        return await _collection.Find(filter).ToListAsync();
    }

    public async Task<IEnumerable<Post>> GetPostsByChannelAsync(int channelId)
    {
        var filter = Builders<Post>.Filter.Eq(p => p.ChannelId, channelId.ToString());
        return await _collection.Find(filter).ToListAsync();
    }

    public async Task AddCommentAsync(string postId, Comment comment)
    {
        Expression<Func<Post, string>> postIdExpression = p => p.Id;
        var filter = Builders<Post>.Filter.Eq(postIdExpression, postId);
        var update = Builders<Post>.Update.Push(p => p.Comments, comment);
        await _collection.UpdateOneAsync(filter, update);
    }

    public async Task UpdateReactionsAsync(string postId, Dictionary<ReactionType, int> reactions)
    {
        Expression<Func<Post, string>> postIdExpression = p => p.Id;
        var filter = Builders<Post>.Filter.Eq(postIdExpression, postId);
        var update = Builders<Post>.Update.Set(p => p.Reactions, reactions);
        await _collection.UpdateOneAsync(filter, update);
    }

    public async Task<IEnumerable<Post>> GetRecentPostsAsync(int count)
    {
        return await _collection
            .Find(_ => true)
            .SortByDescending(p => p.Timestamp)
            .Limit(count)
            .ToListAsync();
    }
}
}