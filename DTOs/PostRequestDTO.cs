using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using ASTREE_PFE.Models;
using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;
using MongoDB.Bson.Serialization.Options;

namespace ASTREE_PFE.DTOs
{
    public class PostRequestDTO
    {
        public string Content { get; set; } = null!;

        [Required]
        public string AuthorId { get; set; } = null!;

        public bool IsPublic { get; set; }

        // Optional channel ID, null by default
        public string? ChannelId { get; set; } = null;
        public List<string> FileIds { get; set; } = new List<string>(); // IDs of uploaded files
    }
}
