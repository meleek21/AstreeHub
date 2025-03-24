using ASTREE_PFE.Models;
using ASTREE_PFE.Repositories.Interfaces;
using MongoDB.Driver;
using System.Linq.Expressions;

namespace ASTREE_PFE.Repositories
{
    public class ConversationRepository : IConversationRepository
    {
        private readonly IMongoCollection<Conversation> _conversations;

        public ConversationRepository(IMongoDatabase database)
        {
            _conversations = database.GetCollection<Conversation>("Conversations");
        }

        public async Task<IEnumerable<Conversation>> GetAllConversationsAsync()
        {
            return await _conversations.Find(_ => true).ToListAsync();
        }

        public async Task<Conversation> GetConversationByIdAsync(string id)
        {
            return await _conversations.Find(c => c.Id == id).FirstOrDefaultAsync();
        }

        public async Task<IEnumerable<Conversation>> GetConversationsByParticipantIdAsync(string participantId)
        {
            return await _conversations
                .Find(c => c.Participants.Contains(participantId))
                .SortByDescending(c => c.UpdatedAt)
                .ToListAsync();
        }

        public async Task<Conversation> GetConversationByParticipantsAsync(List<string> participantIds)
        {
            // For one-to-one conversations, find a conversation with exactly these participants
            if (participantIds.Count == 2)
            {
                var filter = Builders<Conversation>.Filter.And(
                    Builders<Conversation>.Filter.All(c => c.Participants, participantIds),
                    Builders<Conversation>.Filter.Size(c => c.Participants, participantIds.Count),
                    Builders<Conversation>.Filter.Eq(c => c.IsGroup, false)
                );

                return await _conversations.Find(filter).FirstOrDefaultAsync();
            }

            return null;
        }

        public async Task<IEnumerable<Conversation>> FindConversationsAsync(Expression<Func<Conversation, bool>> predicate)
        {
            return await _conversations.Find(predicate).ToListAsync();
        }

        public async Task CreateConversationAsync(Conversation conversation)
        {
            await _conversations.InsertOneAsync(conversation);
        }

        public async Task UpdateConversationAsync(string id, Conversation conversation)
        {
            await _conversations.ReplaceOneAsync(c => c.Id == id, conversation);
        }

        public async Task UpdateLastMessageAsync(string conversationId, string messageId)
        {
            var update = Builders<Conversation>.Update
                .Set(c => c.LastMessageId, messageId)
                .Set(c => c.UpdatedAt, DateTime.UtcNow);

            await _conversations.UpdateOneAsync(c => c.Id == conversationId, update);
        }

        public async Task DeleteConversationAsync(string id)
        {
            await _conversations.DeleteOneAsync(c => c.Id == id);
        }
    }
}