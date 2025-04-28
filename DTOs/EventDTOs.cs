using System.ComponentModel.DataAnnotations;
using ASTREE_PFE.Models;

namespace ASTREE_PFE.DTOs
{
    public class AttendanceStatusUpdateDTO
    {
        [Required]
        public AttendanceStatus Status { get; set; }
    }

    public class EventCreateDTO
    {
        [Required]
        public EventType Type { get; set; } = EventType.General;

        [Required]
        [StringLength(100, MinimumLength = 5)]
        public string Title { get; set; } = null!;

        [Required]
        [StringLength(500)]
        public string Description { get; set; } = null!;

        [Required]
        public DateTime EventDateTime { get; set; }

        [Required]
        public DateTime EndDateTime { get; set; }

        [Required]
        [StringLength(100)]
        public string Location { get; set; } = null!;

        [Required]
        [StringLength(50)]
        public string Organizer { get; set; } = null!;

        public EventCategory Category { get; set; }

        public bool IsOpenEvent { get; set; } = false;

        public bool IsRecurring { get; set; }
        public string AssociatedEmployeeId { get; set; }
    }

    public class EventUpdateDTO
    {
        [StringLength(100, MinimumLength = 5)]
        public string? Title { get; set; }

        [StringLength(500)]
        public string? Description { get; set; }

        public DateTime? EventDateTime { get; set; }

        public DateTime? EndDateTime { get; set; }

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
        public bool IsBirthdayEvent { get; set; } 
        public BirthdayResponseDTO BirthdayDetails { get; set; }
        public string Title { get; set; } = null!;
        public string Description { get; set; } = null!;
        public DateTime EventDateTime { get; set; }
        public DateTime EndDateTime { get; set; }
        public string Location { get; set; } = null!;
        public string Organizer { get; set; } = null!;
        public EventCategory Category { get; set; }
        public List<string> Attendees { get; set; } = new List<string>();
        public EventStatus Status { get; set; }
        public bool IsOpenEvent { get; set; }
        public Dictionary<string, AttendanceStatus> AttendeeStatuses { get; set; } = new Dictionary<string, AttendanceStatus>();
        public Dictionary<string, bool> AttendeeStatusFinal { get; set; } = new Dictionary<string, bool>();
    }

    public class AttendeeUpdateDTO
    {
        [Required]
        public string EmployeeId { get; set; } = null!;
    }

    public class AttendanceStatusResponseDTO
    {
        public string EventId { get; set; } = null!;
        public string EmployeeId { get; set; } = null!;
        public AttendanceStatus Status { get; set; }
        public bool IsFinal { get; set; }
    }
}