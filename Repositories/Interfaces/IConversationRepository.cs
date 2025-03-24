using ASTREE_PFE.Models;
using System.Linq.Expressions;

namespace ASTREE_PFE.Repositories.Interfaces
{
    public interface IConversationRepository
    {
        Task<IEnumerable<Conversation>> GetAllConversationsAsync();
        Task<Conversation> GetConversationByIdAsync(string id);
        Task<IEnumerable<Conversation>> GetConversationsByParticipantIdAsync(string participantId);
        Task<Conversation> GetConversationByParticipantsAsync(List<string> participantIds);
        Task<IEnumerable<Conversation>> FindConversationsAsync(Expression<Func<Conversation, bool>> predicate);
        Task CreateConversationAsync(Conversation conversation);
        Task UpdateConversationAsync(string id, Conversation conversation);
        Task UpdateLastMessageAsync(string conversationId, string messageId);
        Task DeleteConversationAsync(string id);
    }
}