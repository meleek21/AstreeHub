using ASTREE_PFE.Models;
using System;

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
    
    public class EmployeeResponseDto
    {
        public string Id { get; set; }
        public string FirstName { get; set; }
        public string LastName { get; set; }
        public DateTime DateOfBirth { get; set; }
        public RoleType Role { get; set; }
        public UserStatus Status { get; set; }
        public string Email { get; set; }
        public string PasswordHash { get; set; }
        public int? DepartmentId { get; set; }
        public string PhoneNumber { get; set; }
    }
    
    // Other employee DTOs would go here
}