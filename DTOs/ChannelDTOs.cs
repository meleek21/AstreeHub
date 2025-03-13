using System.ComponentModel.DataAnnotations;

namespace ASTREE_PFE.DTOs
{
    public class ChannelCreateDto
    {
        [Required(ErrorMessage = "Channel name is required")]
        [StringLength(100, ErrorMessage = "Channel name cannot exceed 100 characters")]
        public string Name { get; set; } = string.Empty;
        
        // Nullable for general channels that aren't tied to a specific department
        public int? DepartmentId { get; set; }
        
        // Flag to identify general channels accessible to all users
        public bool IsGeneral { get; set; } = false;
        

    }

    public class ChannelUpdateDto
    {
        [Required(ErrorMessage = "Channel name is required")]
        [StringLength(100, ErrorMessage = "Channel name cannot exceed 100 characters")]
        public string Name { get; set; } = string.Empty;
        
        // Nullable for general channels that aren't tied to a specific department
        public int? DepartmentId { get; set; }
        
        // Flag to identify general channels accessible to all users
        public bool IsGeneral { get; set; }
        

    }
}