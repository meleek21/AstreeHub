using System;
using System.Collections.Generic;
using ASTREE_PFE.Models;
using System.ComponentModel.DataAnnotations;
using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;
using MongoDB.Bson.Serialization.Options;

namespace ASTREE_PFE.DTOs
{
    public class PostResponseDTO
    {
        public string Id { get; set; }

        [Required]
        public string Content { get; set; }

        [Required]
        public string AuthorId { get; set; }

        public string AuthorName { get; set; }
        public string AuthorProfilePicture { get; set; }

        [BsonDateTimeOptions(Kind = DateTimeKind.Utc)]
        public DateTime CreatedAt { get; set; }

        public DateTime? UpdatedAt { get; set; }

        public List<string> FileIds { get; set; } = new List<string>();

        public List<FileResponseDTO> Files { get; set; } = new List<FileResponseDTO>();

        public List<Document> Documents { get; set; } = new List<Document>();

        public List<CommentResponseDTO> Comments { get; set; } = new List<CommentResponseDTO>();

        public Dictionary<ReactionType, int> ReactionCounts { get; set; } = new();


        public string ChannelId { get; set; }
    }
}

