using ASTREE_PFE.DTOs;
using ASTREE_PFE.Models;
using ASTREE_PFE.Repositories.Interfaces;
using ASTREE_PFE.Services.Interfaces;
using AutoMapper;

namespace ASTREE_PFE.Services
{
    public class EventService : IEventService
    {
        private readonly IEventRepository _eventRepository;
        private readonly IEmployeeRepository _employeeRepository;
        private readonly IMapper _mapper;

        public EventService(
            IEventRepository eventRepository,
            IEmployeeRepository employeeRepository,
            IMapper mapper)
        {
            _eventRepository = eventRepository;
            _employeeRepository = employeeRepository;
            _mapper = mapper;
        }

        public async Task<EventResponseDTO> CreateEventAsync(EventCreateDTO eventDto)
        {
            var @event = _mapper.Map<Event>(eventDto);
            await _eventRepository.CreateAsync(@event);
            return _mapper.Map<EventResponseDTO>(@event);
        }

        public async Task<EventResponseDTO> GetEventByIdAsync(string id)
        {
            var @event = await _eventRepository.GetByIdAsync(id);
            if (@event == null)
                throw new KeyNotFoundException($"Event with ID {id} not found.");

            return _mapper.Map<EventResponseDTO>(@event);
        }

        public async Task<IEnumerable<EventResponseDTO>> GetAllEventsAsync()
        {
            var events = await _eventRepository.GetAllAsync();
            return _mapper.Map<IEnumerable<EventResponseDTO>>(events);
        }

        public async Task<EventResponseDTO> UpdateEventAsync(string id, EventUpdateDTO eventDto)
        {
            var existingEvent = await _eventRepository.GetByIdAsync(id);
            if (existingEvent == null)
                throw new KeyNotFoundException($"Event with ID {id} not found.");

            // Update only the provided fields
            if (eventDto.Title != null)
                existingEvent.Title = eventDto.Title;
            if (eventDto.Description != null)
                existingEvent.Description = eventDto.Description;
            if (eventDto.EventDateTime.HasValue)
                existingEvent.EventDateTime = eventDto.EventDateTime.Value;
            if (eventDto.Location != null)
                existingEvent.Location = eventDto.Location;
            if (eventDto.Organizer != null)
                existingEvent.Organizer = eventDto.Organizer;
            if (eventDto.Category.HasValue)
                existingEvent.Category = eventDto.Category.Value;
            if (eventDto.IsOpenEvent.HasValue)
                existingEvent.IsOpenEvent = eventDto.IsOpenEvent.Value;

            await _eventRepository.UpdateAsync(id, existingEvent);
            return _mapper.Map<EventResponseDTO>(existingEvent);
        }

        public async Task<bool> DeleteEventAsync(string id)
        {
            var @event = await _eventRepository.GetByIdAsync(id);
            if (@event == null)
                return false;

            await _eventRepository.DeleteAsync(id);
            return true;
        }

        public async Task<bool> AddAttendeeAsync(string eventId, string employeeId)
        {
            // Verify employee exists
            var employee = await _employeeRepository.GetByIdAsync(employeeId);
            if (employee == null)
                throw new KeyNotFoundException($"Employee with ID {employeeId} not found.");

            var @event = await _eventRepository.GetByIdAsync(eventId);
            if (@event == null)
                throw new KeyNotFoundException($"Event with ID {eventId} not found.");

            // Check if event is open or employee has permission
            if (!@event.IsOpenEvent)
            {
                // Add additional permission checks here if needed
            }

            return await _eventRepository.AddAttendeeAsync(eventId, employeeId);
        }

        public async Task<bool> RemoveAttendeeAsync(string eventId, string employeeId)
        {
            var @event = await _eventRepository.GetByIdAsync(eventId);
            if (@event == null)
                throw new KeyNotFoundException($"Event with ID {eventId} not found.");

            return await _eventRepository.RemoveAttendeeAsync(eventId, employeeId);
        }

        public async Task<IEnumerable<EventResponseDTO>> GetEventsByAttendeeAsync(string employeeId)
        {
            var events = await _eventRepository.GetEventsByAttendeeAsync(employeeId);
            return _mapper.Map<IEnumerable<EventResponseDTO>>(events);
        }

        public async Task<IEnumerable<EventResponseDTO>> GetUpcomingEventsAsync()
        {
            var events = await _eventRepository.GetUpcomingEventsAsync();
            return _mapper.Map<IEnumerable<EventResponseDTO>>(events);
        }

        public async Task<IEnumerable<EventResponseDTO>> GetEventsByOrganizerAsync(string organizerId)
        {
            var events = await _eventRepository.GetEventsByOrganizerAsync(organizerId);
            return _mapper.Map<IEnumerable<EventResponseDTO>>(events);
        }

        public async Task<IEnumerable<EventResponseDTO>> GetEventsByCategoryAsync(EventCategory category)
        {
            var events = await _eventRepository.GetEventsByCategoryAsync(category);
            return _mapper.Map<IEnumerable<EventResponseDTO>>(events);
        }

        public async Task<IEnumerable<EventResponseDTO>> GetOpenEventsAsync()
        {
            var events = await _eventRepository.GetOpenEventsAsync();
            return _mapper.Map<IEnumerable<EventResponseDTO>>(events);
        }

        public async Task<bool> UpdateEventStatusAsync(string eventId, EventStatus status)
        {
            var @event = await _eventRepository.GetByIdAsync(eventId);
            if (@event == null)
                throw new KeyNotFoundException($"Event with ID {eventId} not found.");

            return await _eventRepository.UpdateEventStatusAsync(eventId, status);
        }
    }
}