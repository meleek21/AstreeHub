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
        /// <summary>
    /// Gets an existing conversation between two users. Returns null if no conversation exists.
    /// </summary>
    /// <param name="currentUserId">The current user's ID</param>
    /// <param name="otherUserId">The other user's ID</param>
    /// <returns>The conversation if it exists, null otherwise</returns>
    Task<ConversationDto> GetOrCreateConversationWithUserAsync(string currentUserId, string otherUserId);
        Task<ConversationDto> GetConversationByIdAsync(string conversationId, string userId);
        Task<ConversationDto> CreateGroupConversationAsync(string creatorId, List<string> participantIds, string title);
        Task<int> GetUnreadMessagesCountAsync(string userId);
    }
}