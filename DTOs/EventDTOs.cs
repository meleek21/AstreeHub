using System.ComponentModel.DataAnnotations;
using ASTREE_PFE.Models;

namespace ASTREE_PFE.DTOs
{
    public class EventCreateDTO
    {
        [Required]
        [StringLength(100, MinimumLength = 5)]
        public string Title { get; set; } = null!;

        [Required]
        [StringLength(500)]
        public string Description { get; set; } = null!;

        [Required]
        public DateTime EventDateTime { get; set; }

        [Required]
        [StringLength(100)]
        public string Location { get; set; } = null!;

        [Required]
        [StringLength(50)]
        public string Organizer { get; set; } = null!;

        public EventCategory Category { get; set; }

        public bool IsOpenEvent { get; set; } = false;
    }

    public class EventUpdateDTO
    {
        [StringLength(100, MinimumLength = 5)]
        public string? Title { get; set; }

        [StringLength(500)]
        public string? Description { get; set; }

        public DateTime? EventDateTime { get; set; }

        [StringLength(100)]
        public string? Location { get; set; }

        [StringLength(50)]
        public string? Organizer { get; set; }

        public EventCategory? Category { get; set; }

        public bool? IsOpenEvent { get; set; }
    }

    public class EventResponseDTO
    {
        public string Id { get; set; } = null!;
        public string Title { get; set; } = null!;
        public string Description { get; set; } = null!;
        public DateTime EventDateTime { get; set; }
        public string Location { get; set; } = null!;
        public string Organizer { get; set; } = null!;
        public EventCategory Category { get; set; }
        public List<string> Attendees { get; set; } = new List<string>();
        public EventStatus Status { get; set; }
        public bool IsOpenEvent { get; set; }
    }

    public class AttendeeUpdateDTO
    {
        [Required]
        public string EmployeeId { get; set; } = null!;
    }
}