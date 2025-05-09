using ASTREE_PFE.DTOs;
using ASTREE_PFE.Models;

namespace ASTREE_PFE.Services.Interfaces
{
    public interface IEventService
    {
        Task GenerateBirthdayEventsAsync();
        Task<EventResponseDTO> CreateEventAsync(EventCreateDTO eventDto);
        Task<EventResponseDTO> GetEventByIdAsync(string id);
        Task<IEnumerable<EventResponseDTO>> GetAllEventsAsync();
        Task<IEnumerable<BirthdayResponseDTO>> GetRecentBirthdaysAsync(int count);
        Task<EventResponseDTO> UpdateEventAsync(string id, EventUpdateDTO eventDto);
        Task<bool> DeleteEventAsync(string id);

        // Attendee management
        Task<bool> AddAttendeeAsync(string eventId, string employeeId);
        Task<bool> RemoveAttendeeAsync(string eventId, string employeeId);
        Task<IEnumerable<EventResponseDTO>> GetEventsByAttendeeAsync(string employeeId);
        Task<bool> InviteDepartmentAsync(string eventId, string departmentId);
        Task<bool> InviteMultipleAsync(string eventId, List<string> employeeIds);

        // Event filtering
        Task<IEnumerable<EventResponseDTO>> GetUpcomingEventsAsync();
        Task<IEnumerable<EventResponseDTO>> GetEventsByOrganizerAsync(string organizerId);
        Task<IEnumerable<EventResponseDTO>> GetEventsByCategoryAsync(EventCategory category);
        Task<IEnumerable<EventResponseDTO>> GetOpenEventsAsync();
        Task GenerateBirthdayEventsAsync();

        // Status management
        Task<bool> UpdateEventStatusAsync(string eventId, EventStatus status);
        Task<bool> UpdateAttendanceStatusAsync(
            string eventId,
            string employeeId,
            AttendanceStatus status
        );

        // Attendance statistics
        Task<Dictionary<AttendanceStatus, int>> GetAttendanceStatusCountsAsync(string eventId);
        Task<IEnumerable<BirthdayEventDTO>> GetBirthdayEventsAsync(int month);
        Task<IEnumerable<BirthdayResponseDTO>> GetTodaysBirthdaysAsync();
        Task<IEnumerable<BirthdayResponseDTO>> GetClosestBirthdaysAsync();
    }
}
