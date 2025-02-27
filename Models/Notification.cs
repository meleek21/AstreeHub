using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;
using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace ASTREE_PFE.Models
{
    public class Notification
    {
        [BsonId]
        [BsonRepresentation(BsonType.ObjectId)]
        public string Id { get; set; } = null!;  // Changed from Guid to string
        
        [Required]
        public string Content { get; set; } = null!;
        public string RecipientId { get; set; } = null!;
        [Required]
        [BsonDateTimeOptions(Kind = DateTimeKind.Utc)]
        public DateTime Timestamp { get; set; } = DateTime.UtcNow;
        public bool IsRead { get; set; } = false;
        [StringLength(50)]
        public string NotificationType { get; set; } = null!;
        public string? RelatedEntityId { get; set; }
    }
}