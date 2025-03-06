using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;
using MongoDB.Bson.Serialization.Options;
using ASTREE_PFE.Models;

namespace ASTREE_PFE.DTOs
{
    public class PostRequestDTO
    {
        [Required]
        public string Content { get; set; } = null!;

        [Required]
        public string AuthorId { get; set; } = null!;

        public bool IsPublic { get; set; }

        public string[] Tags { get; set; } = Array.Empty<string>();

        public List<Document> Documents { get; set; } = new List<Document>();

        [BsonDictionaryOptions(DictionaryRepresentation.ArrayOfDocuments)]
        public Dictionary<ReactionType, int> ReactionCounts { get; set; }

        public ReactionType? UserReaction { get; set; }

        public List<Comment> Comments { get; set; } = new List<Comment>();

        public Dictionary<ReactionType, int> Reactions { get; set; } = new Dictionary<ReactionType, int>();

        public DateTime Timestamp { get; set; } = DateTime.UtcNow;

        public DateTime? UpdatedAt { get; set; }
    }
}