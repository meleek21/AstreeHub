using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;
using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace ASTREE_PFE.Models
{
    public class Document
    {
        [BsonId]
        [BsonRepresentation(BsonType.ObjectId)]
        public string Id { get; set; } = null!;
        [Required]
        public string Title { get; set; } = null!;
        
        [Required]
        public string Content { get; set; } = null!;
        
        public string AuthorId { get; set; } = null!;  // Changed from Guid
        
        [BsonDateTimeOptions(Kind = DateTimeKind.Utc)]
        public DateTime Timestamp { get; set; } = DateTime.UtcNow;
        
        [Required]
        [StringLength(50)]
        public string Category { get; set; } = null!;
        
        public string? FilePath { get; set; }
        public string? FileType { get; set; }
        public long? FileSize { get; set; }
        public DateTime? LastModified { get; set; }
        public string? Description { get; set; }
        public string[] Tags { get; set; } = Array.Empty<string>();
    }
}