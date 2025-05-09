using ASTREE_PFE.Models;

namespace ASTREE_PFE.Services.Interfaces
{
    public interface IGoogleCalendarService
    {
        Task<string> AddEventToGoogleCalendar(Event eventToAdd);
        Task<bool> UpdateEventInGoogleCalendar(string googleEventId, Event updatedEvent);
        Task<bool> DeleteEventFromGoogleCalendar(string googleEventId);
        Task<string> GetGoogleCalendarEventId(string eventId);
        Task<bool> AddEventToAttendeeCalendarAsync(string eventId, string attendeeEmail);
    }
}
