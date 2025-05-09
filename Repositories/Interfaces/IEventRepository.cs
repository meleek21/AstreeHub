using ASTREE_PFE.Models;

namespace ASTREE_PFE.Repositories.Interfaces
{
    public interface IEventRepository : IMongoRepository<Event>
    {
        Task<bool> ExistsForEmployeeAsync(string employeeId, DateTime eventDate);
        Task<IEnumerable<Event>> GetUpcomingEventsAsync();
        Task<IEnumerable<Event>> GetEventsByOrganizerAsync(string organizerId);
        Task<IEnumerable<Event>> GetEventsByAttendeeAsync(string employeeId);
        Task<bool> AddAttendeeAsync(string eventId, string employeeId);
        Task<bool> RemoveAttendeeAsync(string eventId, string employeeId);
        Task<bool> UpdateEventStatusAsync(string eventId, EventStatus status);
        Task<IEnumerable<Event>> GetEventsByCategoryAsync(EventCategory category);
        Task<IEnumerable<Event>> GetOpenEventsAsync();
        Task<IEnumerable<Event>> GetBirthdayEventsAsync(int month);
        Task<bool> UpdateAttendanceStatusAsync(
            string eventId,
            string employeeId,
            AttendanceStatus status
        );

        Task<bool> UpdateAttendeeStatusFinalAsync(
            string eventId,
            Dictionary<string, bool> statusFinalUpdates
        );
    }
}
