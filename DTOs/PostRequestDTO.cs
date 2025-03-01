using System;
using System.Collections.Generic;
using ASTREE_PFE.Models;
using System.ComponentModel.DataAnnotations;
using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace ASTREE_PFE.DTOs
{
    public class PostRequestDTO
    {
        public string Content { get; set; } = null!;
        
        [Required]
        // Removed the RegularExpression validation for ObjectId
        public string AuthorId { get; set; } = null!;
        
        public bool IsPublic { get; set; }
        public string[] Tags { get; set; } = Array.Empty<string>();
        public List<Document> Documents { get; set; } = new List<Document>();
    }
}