using MongoDB.Driver;
using ASTREE_PFE.Models;
using System.Threading.Tasks;
using System.Collections.Generic;

namespace ASTREE_PFE.Repositories
{
    public class CommentRepository : MongoRepository<Comment>, ICommentRepository
    {
        public CommentRepository(IMongoDatabase database) 
            : base(database, "Comments")
        {
        }

        public async Task<IEnumerable<Comment>> GetCommentsByPostAsync(int postId)
        {
            var filter = Builders<Comment>.Filter.Eq("PostId", postId);
            return await GetCollection().Find(filter).ToListAsync();
        }

        public async Task<IEnumerable<Comment>> GetCommentsByAuthorAsync(string authorId)
        {
            var filter = Builders<Comment>.Filter.Eq("AuthorId", authorId);
            return await GetCollection().Find(filter).ToListAsync();
        }

        public async Task AddReplyAsync(string commentId, Comment reply)
        {
            var filter = Builders<Comment>.Filter.Eq("_id", commentId);
            var update = Builders<Comment>.Update.Push(c => c.Replies, reply);
            await GetCollection().UpdateOneAsync(filter, update);
        }

        public async Task UpdateReactionsAsync(string commentId, Dictionary<ReactionType, int> reactions)
        {
            var filter = Builders<Comment>.Filter.Eq("_id", commentId);
            var update = Builders<Comment>.Update.Set(c => c.Reactions, reactions);
            await GetCollection().UpdateOneAsync(filter, update);
        }
    }
}