using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;
using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace ASTREE_PFE.Models
{
    public class Message
    {
        [BsonId]
        [BsonRepresentation(BsonType.ObjectId)]
        public string Id { get; set; } = null!;

        [Required]
        public string Content { get; set; } = null!;

        [Required]
        public string SenderId { get; set; } = null!; // Changed from Guid to string

        [BsonDateTimeOptions(Kind = DateTimeKind.Utc)]
        public DateTime Timestamp { get; set; } = DateTime.UtcNow;

        public bool IsRead { get; set; } = false;
        public DateTime? ReadAt { get; set; }
        public string? AttachmentUrl { get; set; }

        [Required]
        [BsonRepresentation(BsonType.ObjectId)]
        public string ConversationId { get; set; } = null!;

        // Soft delete: track which users have deleted this message
        public List<string> DeletedForUsers { get; set; } = new List<string>();

        // Edit/Unsend support
        public bool IsEdited { get; set; } = false;
        public bool IsUnsent { get; set; } = false;
        public DateTime? EditedAt { get; set; }
        public DateTime? UnsentAt { get; set; }

        [BsonIgnore]
        public virtual Conversation Conversation { get; set; } = null!;
    }
}
