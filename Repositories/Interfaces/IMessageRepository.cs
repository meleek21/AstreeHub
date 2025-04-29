using ASTREE_PFE.Models;
using System.Linq.Expressions;

namespace ASTREE_PFE.Repositories.Interfaces
{
    public interface IMessageRepository
    {
        Task<IEnumerable<Message>> GetAllMessagesAsync();
        Task<Message> GetMessageByIdAsync(string id);
        Task<IEnumerable<Message>> GetMessagesByConversationIdAsync(string conversationId, int skip = 0, int limit = 50);
        Task<IEnumerable<Message>> FindMessagesAsync(Expression<Func<Message, bool>> predicate);
        Task CreateMessageAsync(Message message);
        Task UpdateMessageAsync(string id, Message message);
        Task UpdateMessageReadStatusAsync(string id, bool isRead, DateTime? readAt = null);
        Task DeleteMessageAsync(string id);
        Task<int> GetUnreadMessagesCountAsync(string recipientId);
    }
}