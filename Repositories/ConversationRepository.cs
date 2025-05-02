using ASTREE_PFE.Models;
using ASTREE_PFE.Repositories.Interfaces;
using MongoDB.Driver;
using System.Linq.Expressions;

namespace ASTREE_PFE.Repositories
{
    public class ConversationRepository : IConversationRepository
    {
        private readonly IMongoCollection<Conversation> _conversations;
        private readonly IMessageRepository _messageRepository;
        
        public ConversationRepository(IMongoDatabase database, IMessageRepository messageRepository)
        {
            _conversations = database.GetCollection<Conversation>("Conversations");
            _messageRepository = messageRepository;
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
                .Find(c => c.Participants.Contains(participantId) && (c.DeletedForUsers == null || !c.DeletedForUsers.Contains(participantId)))
                .SortByDescending(c => c.UpdatedAt)
                .ToListAsync();
        }
        
        public async Task<Conversation> GetConversationByParticipantsAsync(List<string> participantIds)
        {
            // For one-to-one conversations, find a conversation with exactly these participants
            if (participantIds.Count == 2)
            {
                // Sort participant IDs to ensure consistent lookup regardless of order
                var sortedParticipantIds = new List<string>(participantIds);
                sortedParticipantIds.Sort();
                
                // Create a filter that ensures:
                // 1. The conversation has exactly 2 participants
                // 2. The conversation is not a group chat
                // 3. The conversation contains both participants
                var filter = Builders<Conversation>.Filter.And(
                    Builders<Conversation>.Filter.Size(c => c.Participants, 2),
                    Builders<Conversation>.Filter.Eq(c => c.IsGroup, false),
                    Builders<Conversation>.Filter.AnyIn(c => c.Participants, sortedParticipantIds),
                    Builders<Conversation>.Filter.All(c => c.Participants, sortedParticipantIds)
                );
                
                // Use FirstOrDefaultAsync to ensure we only get one result
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
        
        public async Task DeleteConversationAsync(string id, string userId)
        {
            var conversation = await _conversations.Find(c => c.Id == id).FirstOrDefaultAsync();
            if (conversation == null) return;
            if (conversation.DeletedForUsers == null)
                conversation.DeletedForUsers = new List<string>();
            if (!conversation.DeletedForUsers.Contains(userId))
                conversation.DeletedForUsers.Add(userId);
            // If all participants have deleted, remove conversation
            if (conversation.DeletedForUsers.Count == conversation.Participants.Count)
            {
                await _messageRepository.DeleteMessagesByConversationIdAsync(id);
                await _conversations.DeleteOneAsync(c => c.Id == id);
            }
            else
            {
                await _conversations.ReplaceOneAsync(c => c.Id == id, conversation);
            }
        }

        public async Task<bool> PermanentlyDeleteGroupAsync(string conversationId, string userId)
        {
            var conversation = await _conversations.Find(c => c.Id == conversationId).FirstOrDefaultAsync();
            if (conversation == null || !conversation.IsGroup || conversation.CreatorId != userId)
                return false;
            await _messageRepository.DeleteMessagesByConversationIdAsync(conversationId);
            await _conversations.DeleteOneAsync(c => c.Id == conversationId);
            return true;
        }

        public async Task<bool> AddParticipantAsync(string conversationId, string userId, string newParticipantId)
        {
            var conversation = await _conversations.Find(c => c.Id == conversationId).FirstOrDefaultAsync();
            if (conversation == null || !conversation.IsGroup || !conversation.Participants.Contains(userId))
                return false;
            if (!conversation.Participants.Contains(newParticipantId))
            {
                conversation.Participants.Add(newParticipantId);
                await _conversations.ReplaceOneAsync(c => c.Id == conversationId, conversation);
            }
            return true;
        }

        public async Task<bool> RemoveParticipantAsync(string conversationId, string userId, string participantId)
        {
            var conversation = await _conversations.Find(c => c.Id == conversationId).FirstOrDefaultAsync();
            if (conversation == null || !conversation.IsGroup || conversation.CreatorId != userId)
                return false;
            if (conversation.Participants.Contains(participantId))
            {
                conversation.Participants.Remove(participantId);
                await _conversations.ReplaceOneAsync(c => c.Id == conversationId, conversation);
            }
            return true;
        }

        public async Task<bool> LeaveGroupAsync(string conversationId, string userId)
        {
            var conversation = await _conversations.Find(c => c.Id == conversationId).FirstOrDefaultAsync();
            if (conversation == null || !conversation.IsGroup || !conversation.Participants.Contains(userId))
                return false;
            conversation.Participants.Remove(userId);
            if (conversation.Participants.Count == 0)
            {
                await _messageRepository.DeleteMessagesByConversationIdAsync(conversationId);
                await _conversations.DeleteOneAsync(c => c.Id == conversationId);
            }
            else
            {
                await _conversations.ReplaceOneAsync(c => c.Id == conversationId, conversation);
            }
            return true;
        }
        
        public async Task<List<string>> GetParticipantsByConversationIdAsync(string conversationId)
        {
            var conversation = await _conversations.Find(c => c.Id == conversationId).FirstOrDefaultAsync();
            return conversation?.Participants ?? new List<string>();
        }
    }
}
