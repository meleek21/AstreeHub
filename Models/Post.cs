using System.ComponentModel.DataAnnotations;
using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;
using MongoDB.Bson.Serialization.Options;

namespace ASTREE_PFE.Models
{
    public class Post
    {
        [BsonId]
        [BsonRepresentation(BsonType.ObjectId)]
        public string? Id { get; set; }

        [Required]
        public string Content { get; set; } = null!;

        [BsonDateTimeOptions(Kind = DateTimeKind.Utc)]
        public DateTime Timestamp { get; set; } = DateTime.UtcNow;

        [Required]
        public string AuthorId { get; set; } = null!;

        public bool IsPublic { get; set; }
        public DateTime? UpdatedAt { get; set; }

        // File Management
        public List<string> FileIds { get; set; } = new List<string>();
        public List<File> Files { get; set; } = new List<File>();

        // Channel association (nullable for non-channel posts)
        [BsonRepresentation(BsonType.ObjectId)]
        public string ChannelId { get; set; } = null!;

        [BsonIgnore]
        public virtual Channel Channel { get; set; }

        // Post type (General, Channel, Library)
        [BsonRepresentation(BsonType.String)]
        public PostType PostType { get; set; } = PostType.General;
    }
}
