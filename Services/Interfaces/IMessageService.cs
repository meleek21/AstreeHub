using ASTREE_PFE.DTOs;


namespace ASTREE_PFE.Services.Interfaces
{
    public interface IMessageService
    {
        Task<MessageResponseDto> GetMessageByIdAsync(string id);
        Task<IEnumerable<MessageResponseDto>> GetMessagesByConversationIdAsync(
            string conversationId,
            int skip = 0,
            int limit = 50
        );
        Task<MessageResponseDto> CreateMessageAsync(MessageCreateDto messageDto);
        Task<bool> UpdateMessageReadStatusAsync(string messageId, bool isRead, string userId);
        Task<bool> DeleteMessageAsync(string id);
        Task<IEnumerable<ConversationDto>> GetUserConversationsAsync(string userId);
        Task<ConversationDto> GetConversationByIdAsync(string conversationId, string userId);
        Task<ConversationDto> GetOrCreateConversationWithUserAsync(
            string currentUserId,
            string otherUserId
        );
        Task<ConversationDto> CreateGroupConversationAsync(
            CreateConversationDto createConversationDto
        );
        Task<int> GetUnreadMessagesCountAsync(string userId);
        Task<bool> EditMessageAsync(string messageId, MessageCreateDto messageDto);
        Task<bool> UnsendMessageAsync(string messageId, string userId);
        Task<bool> SoftDeleteMessageAsync(string messageId, string userId);
        Task<bool> DeleteConversationAsync(string conversationId, string userId);
        Task<bool> PermanentlyDeleteGroupAsync(string conversationId, string userId);
        Task<bool> AddParticipantToGroupAsync(
            string conversationId,
            string userId,
            string newParticipantId
        );
        Task<bool> RemoveParticipantFromGroupAsync(
            string conversationId,
            string userId,
            string participantId
        );
        Task<bool> LeaveGroupAsync(string conversationId, string userId);
        Task<List<string>> GetParticipantsByConversationIdAsync(string conversationId);
    }
}
