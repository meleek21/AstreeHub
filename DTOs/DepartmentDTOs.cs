using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

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
        public List<string>? EmployeeIds { get; set; }
        public List<EmployeeDTO>? Employees { get; set; }
    }

    public class DepartmentDTO
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
        public string? DirectorId { get; set; }
    }

    public class DepartmentListDto
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
    }
}
