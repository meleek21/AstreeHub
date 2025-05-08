using System.Collections.Generic;
using System.Threading.Tasks;
using ASTREE_PFE.Models;
using ASTREE_PFE.Repositories.Interfaces;
using MongoDB.Bson;
using MongoDB.Driver;

namespace ASTREE_PFE.Repositories
{
    public class CommentRepository : ICommentRepository
    {
        private readonly IMongoCollection<Comment> _comments;

        public CommentRepository(IMongoDatabase database)
        {
            _comments = database.GetCollection<Comment>("Comments");
        }

        public async Task<IEnumerable<Comment>> GetAllAsync()
        {
            return await _comments.Find(_ => true).ToListAsync();
        }

        public async Task<Comment> GetByIdAsync(string id)
        {
            return await _comments.Find(c => c.Id == id).FirstOrDefaultAsync();
        }

        public async Task<IEnumerable<Comment>> GetByPostIdAsync(string postId)
        {
            return await _comments.Find(c => c.PostId == postId).ToListAsync();
        }

        public async Task<IEnumerable<Comment>> GetByAuthorIdAsync(string authorId)
        {
            return await _comments.Find(c => c.AuthorId == authorId).ToListAsync();
        }

        public async Task CreateAsync(Comment comment)
        {
            // Ensure the comment has an ObjectId before inserting if it's empty
            if (string.IsNullOrEmpty(comment.Id))
            {
                comment.Id = ObjectId.GenerateNewId().ToString();
            }

            await _comments.InsertOneAsync(comment);
        }

        public async Task UpdateAsync(string id, Comment comment)
        {
            await _comments.ReplaceOneAsync(c => c.Id == id, comment);
        }

        public async Task DeleteAsync(string id)
        {
            await _comments.DeleteOneAsync(c => c.Id == id);
        }

        public async Task AddReplyAsync(string commentId, Comment reply)
        {
            // Ensure the reply has an ID
            if (string.IsNullOrEmpty(reply.Id))
            {
                reply.Id = ObjectId.GenerateNewId().ToString();
            }

            var filter = Builders<Comment>.Filter.Eq(c => c.Id, commentId);
            var update = Builders<Comment>.Update.Push(c => c.Replies, reply);
            await _comments.UpdateOneAsync(filter, update);
        }

        public async Task UpdateReplyAsync(string commentId, string replyId, Comment updatedReply)
        {
            var filter = Builders<Comment>.Filter.And(
                Builders<Comment>.Filter.Eq(c => c.Id, commentId),
                Builders<Comment>.Filter.Eq("Replies.Id", replyId)
            );
            var update = Builders<Comment>
                .Update.Set("Replies.$.Content", updatedReply.Content)
                .Set("Replies.$.UpdatedAt", updatedReply.UpdatedAt);
            await _comments.UpdateOneAsync(filter, update);
        }

        public async Task DeleteReplyAsync(string commentId, string replyId)
        {
            var filter = Builders<Comment>.Filter.Eq(c => c.Id, commentId);
            var update = Builders<Comment>.Update.PullFilter(c => c.Replies, r => r.Id == replyId);
            await _comments.UpdateOneAsync(filter, update);
        }
    }
}
