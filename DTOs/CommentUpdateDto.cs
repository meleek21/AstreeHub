using System.ComponentModel.DataAnnotations;


namespace ASTREE_PFE.DTOs
{
    public class CommentUpdateDto
    {
        [Required]
        public string Content { get; set; } = null!;
    }
}
