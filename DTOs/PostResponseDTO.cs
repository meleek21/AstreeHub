using System.ComponentModel.DataAnnotations;
using ASTREE_PFE.Models;
using MongoDB.Bson.Serialization.Attributes;

namespace ASTREE_PFE.DTOs
{
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
        public List<string> FileIds { get; set; } = new List<string>();
        public List<FileResponseDTO> Files { get; set; } = new List<FileResponseDTO>();

        public string ChannelId { get; set; }

    }
}