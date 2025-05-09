using System.Linq.Expressions;
using ASTREE_PFE.Models;

namespace ASTREE_PFE.Repositories.Interfaces
{
    public interface IConversationRepository
    {
        Task<IEnumerable<Conversation>> GetAllConversationsAsync();
        Task<Conversation> GetConversationByIdAsync(string id);
        Task<IEnumerable<Conversation>> GetConversationsByParticipantIdAsync(string participantId);
        Task<Conversation> GetConversationByParticipantsAsync(List<string> participantIds);
        Task<IEnumerable<Conversation>> FindConversationsAsync(
            Expression<Func<Conversation, bool>> predicate
        );
        Task CreateConversationAsync(Conversation conversation);
        Task UpdateConversationAsync(string id, Conversation conversation);
        Task UpdateLastMessageAsync(string conversationId, string messageId);
        Task DeleteConversationAsync(string id, string userId);
        Task<bool> PermanentlyDeleteGroupAsync(string conversationId, string userId);
        Task<bool> AddParticipantAsync(
            string conversationId,
            string userId,
            string newParticipantId
        );
        Task<bool> RemoveParticipantAsync(
            string conversationId,
            string userId,
            string participantId
        );
        Task<bool> LeaveGroupAsync(string conversationId, string userId);
        Task<List<string>> GetParticipantsByConversationIdAsync(string conversationId);
    }
}
