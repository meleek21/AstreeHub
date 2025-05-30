using System.ComponentModel.DataAnnotations;
using ASTREE_PFE.Models;
using MongoDB.Bson.Serialization.Attributes;

namespace ASTREE_PFE.DTOs
{
    public class PostRequestDTO
    {
        public string Content { get; set; } = null!;

        [Required]
        public string AuthorId { get; set; } = null!;
        
        public PostType PostType { get; set; } = PostType.General;
        public string? ChannelId { get; set; } = null;

        public List<string> FileIds { get; set; } = new List<string>();
    }

    public class PostResponseDTO
    {
        public string Id { get; set; }
        public string Content { get; set; }
        
        [Required]
        public string AuthorId { get; set; }

        [BsonDateTimeOptions(Kind = DateTimeKind.Utc)]
        public DateTime CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }

        public PostType PostType { get; set; }

        public List<FileResponseDTO> Files { get; set; } = new List<FileResponseDTO>();

        public string ChannelId { get; set; }
    }

    public class PaginatedPostsDTO
    {
        public IEnumerable<PostResponseDTO> Posts { get; set; }
        public string NextLastItemId { get; set; }
        public bool HasMore { get; set; }
    }

    public class ReactionRequest
    {
        [Required]
        public string EmployeeId { get; set; } = null!;

        [Required]
        [Range(0, 5, ErrorMessage = "Reaction type must be between 0 (None) and 5 (Youpi)")]
        public ReactionType Type { get; set; }

        public string? PostId { get; set; }
    }
}