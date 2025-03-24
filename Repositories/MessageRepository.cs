using ASTREE_PFE.Models;
using ASTREE_PFE.Repositories.Interfaces;
using MongoDB.Driver;
using System.Linq.Expressions;

namespace ASTREE_PFE.Repositories
{
    public class MessageRepository : IMessageRepository
    {
        private readonly IMongoCollection<Message> _messages;
        private readonly IMongoCollection<Conversation> _conversationCollection;

        public MessageRepository(IMongoDatabase database)
        {
            _messages = database.GetCollection<Message>("Messages");
            _conversationCollection = database.GetCollection<Conversation>("Conversations");
        }

        public async Task<IEnumerable<Message>> GetAllMessagesAsync()
        {
            return await _messages.Find(_ => true).ToListAsync();
        }

        public async Task<Message> GetMessageByIdAsync(string id)
        {
            return await _messages.Find(m => m.Id == id).FirstOrDefaultAsync();
        }

        public async Task<IEnumerable<Message>> GetMessagesByConversationIdAsync(string conversationId, int skip = 0, int limit = 50)
        {
            return await _messages
                .Find(m => m.ConversationId == conversationId)
                .SortByDescending(m => m.Timestamp)
                .Skip(skip)
                .Limit(limit)
                .ToListAsync();
        }

        public async Task<IEnumerable<Message>> FindMessagesAsync(Expression<Func<Message, bool>> predicate)
        {
            return await _messages.Find(predicate).ToListAsync();
        }

        public async Task CreateMessageAsync(Message message)
        {
            await _messages.InsertOneAsync(message);
        }

        public async Task UpdateMessageAsync(string id, Message message)
        {
            await _messages.ReplaceOneAsync(m => m.Id == id, message);
        }

        public async Task UpdateMessageStatusAsync(string id, string status, DateTime? readAt = null)
        {
            var update = Builders<Message>.Update;
            var updates = new List<UpdateDefinition<Message>>();

            if (status == "read")
            {
                updates.Add(update.Set(m => m.IsRead, true));
                updates.Add(update.Set(m => m.ReadAt, readAt ?? DateTime.UtcNow));
            }

            if (updates.Any())
            {
                await _messages.UpdateOneAsync(m => m.Id == id, update.Combine(updates));
            }
        }

        public async Task DeleteMessageAsync(string id)
        {
            await _messages.DeleteOneAsync(m => m.Id == id);
        }

        public async Task<int> GetUnreadMessagesCountAsync(string userId)
        {
            var conversations = await _conversationCollection
                .Find(c => c.Participants.Contains(userId))
                .ToListAsync();

            var conversationIds = conversations.Select(c => c.Id).ToList();

            var count = await _messages
                .Find(m => conversationIds.Contains(m.ConversationId) && m.SenderId != userId && !m.IsRead)
                .CountDocumentsAsync();
            return (int)count;
        }
    }
}