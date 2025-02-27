using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;
using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace ASTREE_PFE.Models
{
    public class Comment
    {
        [BsonId]
        [BsonRepresentation(BsonType.ObjectId)]
        public Guid Id { get; set; }
        
        [Required]
        public string Content { get; set; } = null!;
        public DateTime Timestamp { get; set; }
        public Guid AuthorId { get; set; }
        public Guid PostId { get; set; }

        public List<Comment> Replies { get; set; } = new List<Comment>();
        public Dictionary<ReactionType, int> Reactions { get; set; } = new Dictionary<ReactionType, int>();
    }
}