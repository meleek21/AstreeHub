using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;
using MongoDB.Bson.Serialization.Options;
using MongoDB.Bson.Serialization.Options;
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace ASTREE_PFE.Models 
{
    public class Comment
    {
        [BsonId]
        [BsonRepresentation(BsonType.ObjectId)]
        [BsonIgnoreIfDefault] // Add this attribute
        public string Id { get; set; } = string.Empty; // Initialize with empty string
        
        [Required]
        public string Content { get; set; } = null!;
        
        [BsonDateTimeOptions(Kind = DateTimeKind.Utc)]
        public DateTime Timestamp { get; set; } = DateTime.UtcNow;
        
        [Required]
        // Removed BsonRepresentation to allow GUIDs, matching our Post.AuthorId approach
        public string AuthorId { get; set; } = null!;
        
        [BsonRepresentation(BsonType.ObjectId)]
        public string PostId { get; set; } = null!;
        
        public List<Comment> Replies { get; set; } = new List<Comment>();
        
        public DateTime? UpdatedAt { get; set; }
    }
}