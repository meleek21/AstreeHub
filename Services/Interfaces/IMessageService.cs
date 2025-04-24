using ASTREE_PFE.DTOs;
using ASTREE_PFE.Models;

namespace ASTREE_PFE.Services.Interfaces
{
    public interface IMessageService
    {
        Task<MessageResponseDto> GetMessageByIdAsync(string id);
        Task<IEnumerable<MessageResponseDto>> GetMessagesByConversationIdAsync(string conversationId, int skip = 0, int limit = 50);
        Task<MessageResponseDto> CreateMessageAsync(MessageCreateDto messageDto);
        Task<bool> UpdateMessageStatusAsync(string messageId, string status, string userId);
        Task<bool> DeleteMessageAsync(string id);
        Task<IEnumerable<ConversationDto>> GetUserConversationsAsync(string userId);
        Task<ConversationDto> GetConversationByIdAsync(string conversationId, string userId);
        Task<ConversationDto> GetOrCreateConversationWithUserAsync(string currentUserId, string otherUserId);
        Task<ConversationDto> CreateGroupConversationAsync(CreateConversationDto createConversationDto);
        Task<int> GetUnreadMessagesCountAsync(string userId);
    }
}