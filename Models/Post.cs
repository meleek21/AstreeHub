using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;
using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace ASTREE_PFE.Models
{
    public class Post
    {
        [BsonId]
        [BsonRepresentation(BsonType.ObjectId)]
        public string Id { get; set; }
        [Required]
        public string Content { get; set; } = null!;
        
        public DateTime Timestamp { get; set; }
        public Guid AuthorId { get; set; }
        public string ChannelId { get; set; }
        public bool IsPublic { get; set; }

        public List<Comment> Comments { get; set; } = new List<Comment>();
        public Dictionary<ReactionType, int> Reactions { get; set; } = new Dictionary<ReactionType, int>();
        public string[] Tags { get; set; } = Array.Empty<string>();
    }
}