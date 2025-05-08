using System;
using ASTREE_PFE.Models;

namespace ASTREE_PFE.DTOs
{
    public class UserInfoDTO
    {
        public string Id { get; set; } = string.Empty;
        public string FirstName { get; set; } = string.Empty;
        public string LastName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public DateTime DateOfBirth { get; set; }
        public RoleType Role { get; set; }
        public UserStatus Status { get; set; }
        public int? DepartmentId { get; set; }
        public DateTime? LastLoginDate { get; set; }
        public bool IsFirstLogin { get; set; }
        public DateTime CreatedDate { get; set; }
        public DepartmentDTO? Department { get; set; }
        public string ProfilePictureUrl { get; set; }
    }
}
