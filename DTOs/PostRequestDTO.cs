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

        // Optional channel ID, null by default
        public string? ChannelId { get; set; } = null;
        public List<string> FileIds { get; set; } = new List<string>(); // IDs of uploaded files

    }
}