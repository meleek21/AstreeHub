using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace ASTREE_PFE.Models
{
    public class Department
    {
        [Key]
        public int Id { get; set; }

        [Required(ErrorMessage = "Department name is required.")]
        [StringLength(
            100,
            MinimumLength = 2,
            ErrorMessage = "Department name must be between 2 and 100 characters."
        )]
        public string Name { get; set; } = string.Empty;

        [StringLength(500, ErrorMessage = "Description cannot exceed 500 characters.")]
        public string? Description { get; set; }

        public string? DirectorId { get; set; }

        // Navigation property for Director
        [JsonIgnore]
        public virtual Employee? Director { get; set; }

        // Navigation property for Employees in this department
        [JsonIgnore]
        public virtual ICollection<Employee> Employees { get; set; } = new List<Employee>();

        // Reference to department's channel - stores the MongoDB ObjectId as string
        public string? ChannelId { get; set; }

        // Navigation property for Channel (not mapped to database)
        [NotMapped]
        public virtual Channel? Channel { get; set; }
    }
}
