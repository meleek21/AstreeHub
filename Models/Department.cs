using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ASTREE_PFE.Models
{
    public class Department
    {
        [Key]
        public int Id { get; set; }

        [Required(ErrorMessage = "Department name is required.")]
        [StringLength(100, MinimumLength = 2, ErrorMessage = "Department name must be between 2 and 100 characters.")]
        public string Name { get; set; } = string.Empty;

        [StringLength(500, ErrorMessage = "Description cannot exceed 500 characters.")]
        public string? Description { get; set; }

        [ForeignKey(nameof(Director))]
        public string? DirectorId { get; set; }  // Made nullable

        public virtual List<Employee> Members { get; set; } = new();

        public virtual Employee? Director { get; set; }  // Made nullable
    }
}