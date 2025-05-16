using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;
using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace ASTREE_PFE.Models
{
    public class Notification
    {
        [BsonId]
        [BsonRepresentation(BsonType.ObjectId)]
        public string Id { get; set; } = null!;

        [Required]
        public string Content { get; set; } = null!;

        public string RecipientId { get; set; } = null!;

        [Required]
        [BsonDateTimeOptions(Kind = DateTimeKind.Utc)]
        public DateTime Timestamp { get; set; } = DateTime.UtcNow;

        public bool IsRead { get; set; } = false;

        [BsonRepresentation(BsonType.String)]
        public NotificationType NotificationType { get; set; }



        // Additional properties for richer notifications
        public string? SenderName { get; set; }

        public string? Title { get; set; }

        // ID of the related entity (e.g., post, comment, etc.)
        public string? RelatedEntityId { get; set; }
    }
}
