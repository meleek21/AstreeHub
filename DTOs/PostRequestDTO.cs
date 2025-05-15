using System.ComponentModel.DataAnnotations;
using ASTREE_PFE.Models;

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
}