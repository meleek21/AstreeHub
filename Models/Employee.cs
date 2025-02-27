using Microsoft.AspNetCore.Identity;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;  // Add this line for ForeignKey

namespace ASTREE_PFE.Models
{
    public class Employee : IdentityUser
    {
        [Required]
        [StringLength(50, MinimumLength = 2, ErrorMessage = "First Name must be between 2 and 50 characters.")]
        public string FirstName { get; set; } = null!;

        [Required]
        [StringLength(50, MinimumLength = 2, ErrorMessage = "Last Name must be between 2 and 50 characters.")]
        public string LastName { get; set; } = null!;

        [Required]
        [EmailAddress(ErrorMessage = "Invalid Email Address.")]
        public override string Email 
        { 
            get => base.Email!; 
            set => base.Email = value; 
        }

        [Required]
        [EnumDataType(typeof(RoleType), ErrorMessage = "Invalid role type.")]
        public RoleType Role { get; set; }

        [Required]
        [EnumDataType(typeof(UserStatus), ErrorMessage = "Invalid status.")]
        public UserStatus Status { get; set; }

        // [Required]
        [ForeignKey(nameof(Department))]
        public int? DepartmentId { get; set; }

        public virtual Department? Department { get; set; }

        // Added properties for authentication
        [PersonalData]
        public DateTime? LastLoginDate { get; set; }

        [PersonalData]
        public bool IsFirstLogin { get; set; } = true;

        [PersonalData]
        public DateTime CreatedDate { get; set; } = DateTime.UtcNow;

        // Add Date of Birth field
        [PersonalData]
        [DataType(DataType.Date)]  // Ensures the field is treated as a date in forms
        [DisplayFormat(DataFormatString = "{0:yyyy-MM-dd}", ApplyFormatInEditMode = true)]  // Format for display
        public DateTime? DateOfBirth { get; set; }  // Nullable if optional
    }
}