// ASTREE_PFE/DTOs/ReactionRequest.cs
using System.ComponentModel.DataAnnotations;
using ASTREE_PFE.Models; // Add this line

namespace ASTREE_PFE.DTOs
{
    public class ReactionRequest
    {
        [Required]
        public string EmployeeId { get; set; } = null!;

        [Required]
        public ReactionType Type { get; set; }

        public string? PostId { get; set; }
        public string? CommentId { get; set; }
    }
}