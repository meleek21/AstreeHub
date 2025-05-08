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
        [Range(0, 5, ErrorMessage = "Reaction type must be between 0 (None) and 5 (Youpi)")]
        public ReactionType Type { get; set; }

        public string? PostId { get; set; }
    }
}
