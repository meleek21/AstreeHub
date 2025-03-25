using ASTREE_PFE.DTOs;
using ASTREE_PFE.Models;

namespace ASTREE_PFE.Services.Interfaces
{
    public interface IEventService
    {
        Task<EventResponseDTO> CreateEventAsync(EventCreateDTO eventDto);
        Task<EventResponseDTO> GetEventByIdAsync(string id);
        Task<IEnumerable<EventResponseDTO>> GetAllEventsAsync();
        Task<EventResponseDTO> UpdateEventAsync(string id, EventUpdateDTO eventDto);
        Task<bool> DeleteEventAsync(string id);
        
        // Attendee management
        Task<bool> AddAttendeeAsync(string eventId, string employeeId);
        Task<bool> RemoveAttendeeAsync(string eventId, string employeeId);
        Task<IEnumerable<EventResponseDTO>> GetEventsByAttendeeAsync(string employeeId);
        
        // Event filtering
        Task<IEnumerable<EventResponseDTO>> GetUpcomingEventsAsync();
        Task<IEnumerable<EventResponseDTO>> GetEventsByOrganizerAsync(string organizerId);
        Task<IEnumerable<EventResponseDTO>> GetEventsByCategoryAsync(EventCategory category);
        Task<IEnumerable<EventResponseDTO>> GetOpenEventsAsync();
        
        // Status management
        Task<bool> UpdateEventStatusAsync(string eventId, EventStatus status);
    }
}