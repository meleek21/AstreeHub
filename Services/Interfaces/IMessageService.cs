using ASTREE_PFE.DTOs;

namespace ASTREE_PFE.Services.Interfaces
{
    public interface IMessageService
    {
        Task<MessageResponseDto> GetMessageByIdAsync(string id);
        Task<IEnumerable<MessageResponseDto>> GetMessagesByConversationIdAsync(string conversationId, int skip = 0, int limit = 50);
        Task<MessageResponseDto> CreateMessageAsync(string senderId, MessageCreateDto messageDto);
        Task<bool> UpdateMessageStatusAsync(string messageId, string status);
        Task<bool> DeleteMessageAsync(string id);
        Task<IEnumerable<ConversationDto>> GetUserConversationsAsync(string userId);
        Task<ConversationDto> GetConversationByIdAsync(string conversationId, string userId);
        Task<ConversationDto> CreateGroupConversationAsync(string creatorId, List<string> participantIds, string title);
        Task<int> GetUnreadMessagesCountAsync(string userId);
    }
}