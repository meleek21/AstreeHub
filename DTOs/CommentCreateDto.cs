using System.ComponentModel.DataAnnotations;

namespace ASTREE_PFE.DTOs
{
    public class CommentCreateDto
    {
        [Required]
        public string Content { get; set; } = null!;

        [Required]
        public string AuthorId { get; set; } = null!;

        [Required]
        public string PostId { get; set; } = null!;
    }
}
