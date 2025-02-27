using System.ComponentModel.DataAnnotations;
using System.Collections.Generic;

namespace ASTREE_PFE.DTOs
{
    public class DepartmentCreateDto
    {
        [Required]
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
        public string? DirectorId { get; set; }
    }

    public class DepartmentUpdateDto
    {
        [Required]
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
        public string? DirectorId { get; set; }
    }

    public class DirectorAssignDto
    {
        public string EmployeeId { get; set; } = string.Empty;
    }

    public class DepartmentResponseDto
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
        public string? DirectorId { get; set; }
        // Make sure EmployeeResponseDto is properly referenced
        public ICollection<EmployeeResponseDto>? Employees { get; set; }
    }
}