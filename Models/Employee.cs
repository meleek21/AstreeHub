using Microsoft.AspNetCore.Identity;
using System;
using System.Text.Json.Serialization;

namespace ASTREE_PFE.Models
{
    public class Employee : IdentityUser
    {
        public string FirstName { get; set; } = string.Empty;
        public string LastName { get; set; } = string.Empty;
        public DateTime DateOfBirth { get; set; }
        public RoleType Role { get; set; }
        public UserStatus Status { get; set; }
        public int? DepartmentId { get; set; }
        
        // Add these missing properties referenced in AuthService
        public DateTime? LastLoginDate { get; set; }
        public bool IsFirstLogin { get; set; } = true;
        public DateTime CreatedDate { get; set; } = DateTime.UtcNow;
        
        // Navigation property for Department
        [JsonIgnore]
        public virtual Department? Department { get; set; }
    }
}