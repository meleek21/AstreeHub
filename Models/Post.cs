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
        public List<Comment> Comments { get; set; } = new List<Comment>();

        public DateTime? UpdatedAt { get; set; }
        public List<string> FileIds { get; set; } = new List<string>();

        [BsonDictionaryOptions(DictionaryRepresentation.ArrayOfDocuments)]
        public Dictionary<ReactionType, int> ReactionCounts { get; set; } = new();

        [BsonRepresentation(BsonType.ObjectId)]
        public string ChannelId { get; set; } = null!;

        [BsonIgnore]
        public virtual Channel Channel { get; set; }

        [BsonElement("Files")]
        public List<File> Files { get; set; } = new List<File>();

        public bool IsLibraryPost { get; set; }
    }
}
