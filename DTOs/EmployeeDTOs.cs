using ASTREE_PFE.Models;
using System;
using System.ComponentModel.DataAnnotations;

namespace ASTREE_PFE.DTOs
{
    public class EmployeeCreateDto
    {
        public string FirstName { get; set; } = string.Empty;
        public string LastName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
        public string PhoneNumber { get; set; } = string.Empty;
        public DateTime DateOfBirth { get; set; }
        public int? DepartmentId { get; set; }
        public RoleType Role { get; set; }
    }

    public class EmployeeUpdateDto
    {
        public string FirstName { get; set; } = string.Empty;
        public string LastName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string PhoneNumber { get; set; } = string.Empty;
        public DateTime DateOfBirth { get; set; }
        public int? DepartmentId { get; set; }
        public RoleType Role { get; set; }
    }

    public class StatusUpdateDto
    {
        public UserStatus Status { get; set; }
    }

    public class DepartmentAssignDto
    {
        public int DepartmentId { get; set; }
    }
}