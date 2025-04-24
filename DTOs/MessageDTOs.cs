using System.Text.Json.Serialization;

namespace ASTREE_PFE.DTOs
{
    public class MessageCreateDto
    {
        public string Content { get; set; } = null!;
        public string? ConversationId { get; set; }
        public string? AttachmentUrl { get; set; }
        public string UserId { get; set; } = null!;
    }

    public class MessageResponseDto
    {
        public string Id { get; set; } = null!;
        public string Content { get; set; } = null!;
        public string SenderId { get; set; } = null!;
        public string? SenderName { get; set; }
        public string? SenderProfilePicture { get; set; }
        public string? RecipientName { get; set; }
        public string? RecipientProfilePicture { get; set; }
        public DateTime Timestamp { get; set; }
        public bool IsRead { get; set; }
        public DateTime? ReadAt { get; set; }
        public string? AttachmentUrl { get; set; }
        public string ConversationId { get; set; } = null!;
    }

    public class MessageStatusUpdateDto
    {
        public string MessageId { get; set; } = null!;
        public string Status { get; set; } = null!; // "read", "delivered", etc.
        public string UserId { get; set; } = null!;
    }

    public class ConversationDto
    {
        public string Id { get; set; } = null!;
        public List<ParticipantDto> Participants { get; set; } = new List<ParticipantDto>();
        public MessageResponseDto? LastMessage { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
        public string? Title { get; set; }
        public bool IsGroup { get; set; }
        public int UnreadCount { get; set; }
    }

    public class ParticipantDto
    {
        public string Id { get; set; } = null!;
        public string Name { get; set; } = null!;
        public string? ProfilePictureUrl { get; set; }
        public bool IsOnline { get; set; }
    }

    public class CreateConversationDto
    {
        public List<string> ParticipantIds { get; set; } = new List<string>();
        public string? Title { get; set; }
        public bool IsGroup { get; set; }
        public string UserId { get; set; } = null!;
    }
    
    public class GetConversationRequestDto
    {
        public string UserId { get; set; } = null!;
    }
    
    public class GetMessagesRequestDto
    {
        public string UserId { get; set; } = null!;
        public int Skip { get; set; } = 0;
        public int Limit { get; set; } = 50;
    }
    
    public class GetConversationWithUserDto
    {
        public string UserId { get; set; } = null!;
        public string OtherUserId { get; set; } = null!;
    }
    

}