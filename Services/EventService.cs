using ASTREE_PFE.DTOs;
using ASTREE_PFE.Models;
using ASTREE_PFE.Repositories.Interfaces;
using ASTREE_PFE.Services.Interfaces;
using AutoMapper;
using Microsoft.Extensions.Logging;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using ASTREE_PFE.Data;
using ASTREE_PFE.Repositories;

namespace ASTREE_PFE.Services
{
    public class EventService : IEventService
    {
        private readonly IEventRepository _eventRepository;
        private readonly IEmployeeRepository _employeeRepository;
        private readonly IDepartmentRepository _departmentRepository;
        private readonly IMapper _mapper;
        private readonly ApplicationDbContext _applicationDbContext;
        private readonly ILogger<EventService> _logger;
        private readonly IEmployeeService _employeeService;
        private readonly INotificationService _notificationService; // Added

        public EventService(
            IEventRepository eventRepository,
            IEmployeeRepository employeeRepository,
            IDepartmentRepository departmentRepository,
            IMapper mapper,
            ApplicationDbContext applicationDbContext,
            ILogger<EventService> logger,
            IEmployeeService employeeService,
            INotificationService notificationService) // Added
        {
            _eventRepository = eventRepository;
            _employeeRepository = employeeRepository;
            _employeeService = employeeService;
            _departmentRepository = departmentRepository;
            _mapper = mapper;
            _applicationDbContext = applicationDbContext;
            _notificationService = notificationService; // Added
            _logger = logger; // Assign logger
        }



public async Task<EventResponseDTO> CreateEventAsync(EventCreateDTO eventDto)
        {
            var @event = _mapper.Map<Event>(eventDto);
            // Always derive type from category
            var derivedType = Event.GetEventType(eventDto.Category);
            @event.Type = derivedType;
            await _eventRepository.CreateAsync(@event);

            // Notification logic
            if (@event.IsOpenEvent || @event.Type == EventType.Anniversaire)
            {
                var allEmployees = await _employeeService.GetAllEmployeesAsync();
                var recipientIds = allEmployees.Select(e => e.Id).ToList();
                // Exclude the organizer if they are part of all employees
                if (!string.IsNullOrEmpty(@event.Organizer))
                {
                    recipientIds.Remove(@event.Organizer);
                }
                // Create notification for each recipient
                foreach (var recipientId in recipientIds)
                {
                    await _notificationService.CreateEventInvitationNotificationAsync(@event.Organizer ?? "System", recipientId, @event.Id, @event.Title, @event.EventDateTime);
                }
            }

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
            return _mapper.Map<List<EventResponseDTO>>(events);
        }

        public async Task<IEnumerable<BirthdayResponseDTO>> GetRecentBirthdaysAsync(int count = 4)
        {
            var allEmployees = await _employeeService.GetAllEmployeesAsync();
            var today = DateTime.Today;

            var recentBirthdays = allEmployees
                .Select(e => {
            // Calculate this year's birthday
                var thisBirthday = new DateTime(today.Year, e.DateOfBirth.Month, e.DateOfBirth.Day);
            
            // If the birthday has already passed this year, calculate days since
                if (thisBirthday < today)
                {
                    int daysSince = (today - thisBirthday).Days;
                    return new BirthdayResponseDTO
                    {
                        EmployeeId = e.Id,
                        FullName = e.FullName,
                        DateOfBirth = e.DateOfBirth,
                        Age = today.Year - e.DateOfBirth.Year,
                        ProfilePictureUrl = e.ProfilePictureUrl,
                        NextBirthday = thisBirthday,
                        DaysUntilNextBirthday = -daysSince // Negative value indicates past date
                    };
                }
            // If birthday is today
                else if (thisBirthday == today)
                {
                    return new BirthdayResponseDTO
                    {
                        EmployeeId = e.Id,
                        FullName = e.FullName,
                        DateOfBirth = e.DateOfBirth,
                        Age = today.Year - e.DateOfBirth.Year,
                        ProfilePictureUrl = e.ProfilePictureUrl,
                        NextBirthday = thisBirthday,
                        DaysUntilNextBirthday = 0
                    };
                }
            // If birthday is in the future this year, calculate last year's birthday
                else
                {
                    var lastBirthday = thisBirthday.AddYears(-1);
                    int daysSince = (today - lastBirthday).Days;
                    return new BirthdayResponseDTO
                    {
                        EmployeeId = e.Id,
                        FullName = e.FullName,
                        DateOfBirth = e.DateOfBirth,
                        Age = today.Year - e.DateOfBirth.Year - 1,
                        ProfilePictureUrl = e.ProfilePictureUrl,
                        NextBirthday = lastBirthday,
                        DaysUntilNextBirthday = -daysSince // Negative value indicates past date
                    };
                }
            })
            .Where(b => b.DaysUntilNextBirthday <= 0) // Only include past birthdays (including today)
            .OrderByDescending(b => b.NextBirthday) // Order by most recent first
            .Take(count)
            .ToList();
            return recentBirthdays;
        }

        public async Task GenerateBirthdayEventsAsync()
        {
            try
            {
                var employees = (await _employeeRepository.GetAllAsync()).ToList();
                var currentYear = DateTime.Now.Year;
                var currentDate = DateTime.Now.Date;
                var batchSize = 20;
                for (int i = 0; i < employees.Count; i += batchSize)
                {
                    var batch = employees.Skip(i).Take(batchSize).ToList();
                    foreach (var employee in batch)
                    {
                        var birthdayDate = new DateTime(currentYear, employee.DateOfBirth.Month, employee.DateOfBirth.Day);
                        if (birthdayDate < currentDate)
                            continue;
                        if (await _eventRepository.ExistsForEmployeeAsync(employee.Id, birthdayDate))
                        {
                            _logger.LogInformation($"Birthday event already exists for {employee.FullName} on {birthdayDate:d}");
                            continue;
                        }
                        var birthdayEventDto = new EventCreateDTO
                        {
                            Title = $"C'est l'anniversaire de {employee.FullName}!",
                            Description = "Célébrons l'anniversaire!",
                            Category = EventCategory.Anniversaire,
                            EventDateTime = birthdayDate,
                            EndDateTime = birthdayDate.AddHours(1),
                            Location = "",
                            Organizer = "System",
                            IsRecurring = true,
                            IsOpenEvent = true,
                            AssociatedEmployeeId = employee.Id
                        };
                        await CreateEventAsync(birthdayEventDto);
                        _logger.LogInformation($"Created birthday event for {employee.FullName} on {birthdayDate:d}");
                    }
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error generating birthday events");
            }
        }
        

        public async Task<EventResponseDTO> UpdateEventAsync(string id, EventUpdateDTO eventDto)
{
    var existingEvent = await _eventRepository.GetByIdAsync(id);
    if (existingEvent == null)
        throw new KeyNotFoundException($"Event with ID {id} not found.");

    // Always set Type using GetEventType(Category) if category is provided
    if (eventDto.Category.HasValue)
    {
        var derivedType = Event.GetEventType(eventDto.Category.Value);
        existingEvent.Type = derivedType;
        existingEvent.Category = eventDto.Category.Value;
    }

    // Store original details for comparison if needed for notifications
    var originalTitle = existingEvent.Title;
    var originalDateTime = existingEvent.EventDateTime;

    // Update only the provided fields
    bool updated = false;
    if (eventDto.Title != null && existingEvent.Title != eventDto.Title)
    {
        existingEvent.Title = eventDto.Title;
        updated = true;
    }
    // [rest of your update code remains the same]

    if (updated)
    {
        await _eventRepository.UpdateAsync(id, existingEvent);

        // Now handle notifications based on whether the event is open or closed
        if (existingEvent.IsOpenEvent)
        {
            // For open events, notify all employees
            var allEmployees = await _employeeService.GetAllEmployeesAsync();
            var recipientIds = allEmployees.Select(e => e.Id).ToList();
            // Create notification for each recipient
            await _notificationService.CreateEventUpdateNotificationAsync(
                existingEvent.Id, 
                existingEvent.Title, 
                recipientIds, 
                "Update", 
                "This event has been updated."
            );
        }
        else
        {
            // For closed events, only notify attendees
            if (existingEvent.Attendees.Any())
            {
                await _notificationService.CreateEventUpdateNotificationAsync(
                    existingEvent.Id, 
                    existingEvent.Title, 
                    existingEvent.Attendees.ToList(), 
                    "Update", 
                    "This event has been updated."
                );
            }
        }
    }

    return _mapper.Map<EventResponseDTO>(existingEvent);
}

// Improved DeleteEventAsync method
        public async Task<bool> DeleteEventAsync(string id)
{
    var eventToDelete = await _eventRepository.GetByIdAsync(id);
    if (eventToDelete == null)
        return false;

    // Handle notifications before deleting the event
    if (eventToDelete.IsOpenEvent)
    {
        // For open events, notify all employees
        var allEmployees = await _employeeService.GetAllEmployeesAsync();
        var recipientIds = allEmployees.Select(e => e.Id).ToList();
        
        await _notificationService.CreateEventUpdateNotificationAsync(
            eventToDelete.Id, 
            eventToDelete.Title, 
            recipientIds, 
            "Cancellation", 
            "This event has been cancelled."
        );
    }
    else
    {
        // For closed events, only notify attendees
        if (eventToDelete.Attendees.Any())
        {
            await _notificationService.CreateEventUpdateNotificationAsync(
                eventToDelete.Id, 
                eventToDelete.Title, 
                eventToDelete.Attendees.ToList(), 
                "Cancellation", 
                "This event has been cancelled."
            );
        }
    }

    // Proceed with deletion
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
            
            // Reset attendance status and finality when re-inviting
            if (@event.Attendees.Contains(employeeId))
            {
                // Only allow re-invitation if the organizer is doing it
                // Assuming organizer check happens elsewhere or is implicit
                // Remove existing status and finality
                bool isReInvite = false; // Declare isReInvite
                await _eventRepository.RemoveAttendeeAsync(eventId, employeeId); // Consider if RemoveAttendeeAsync should handle status reset
                isReInvite = true;
            }

            var added = await _eventRepository.AddAttendeeAsync(eventId, employeeId);

            if (added && !@event.IsOpenEvent) // Only notify for closed events
            {
                string organizerId = @event.Organizer ?? "System"; // Handle null organizer
                await _notificationService.CreateEventInvitationNotificationAsync(organizerId, employeeId, eventId, @event.Title, @event.EventDateTime);
            }

            return added;
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
        
        public async Task<bool> UpdateAttendanceStatusAsync(string eventId, string employeeId, AttendanceStatus status)
        {
            // Verify event exists
            var @event = await _eventRepository.GetByIdAsync(eventId);
            if (@event == null)
                throw new KeyNotFoundException($"Event with ID {eventId} not found.");

            // Verify employee is an attendee
            if (!@event.Attendees.Contains(employeeId))
                throw new KeyNotFoundException($"Employee with ID {employeeId} is not an attendee of this event.");

            // Check if the attendee's status is already final
            if (@event.AttendeeStatusFinal.TryGetValue(employeeId, out bool isFinal) && isFinal)
                throw new InvalidOperationException("Cannot change attendance status after it has been finalized.");

            // If the status is Accepted or Declined, mark it as final
            bool markAsFinal = status == AttendanceStatus.Accepté || status == AttendanceStatus.Refusé;

            // Update attendance status first
            var statusUpdated = await _eventRepository.UpdateAttendanceStatusAsync(eventId, employeeId, status);

            if (statusUpdated)
            {
                // Update finality status if needed
                if (markAsFinal)
                {
                    var updates = new Dictionary<string, bool> { { employeeId, true } };
                    await _eventRepository.UpdateAttendeeStatusFinalAsync(eventId, updates);
                }

                // Notify organizer if status is Accepted
                if (status == AttendanceStatus.Accepté && !string.IsNullOrEmpty(@event.Organizer))
                {
                    // Need employee's name for a better notification message
                    var attendee = await _employeeService.GetEmployeeByIdAsync(employeeId);
                    string attendeeName = attendee?.FullName ?? "An attendee";
                    await _notificationService.CreateEventStatusChangeNotificationAsync(eventId, @event.Title, @event.Organizer, status, attendeeName); // Changed parameters to match interface
                }
            }

            return statusUpdated;
        }

        public async Task<Dictionary<AttendanceStatus, int>> GetAttendanceStatusCountsAsync(string eventId)
        {
            var @event = await _eventRepository.GetByIdAsync(eventId);
            if (@event == null)
                throw new KeyNotFoundException($"Event with ID {eventId} not found.");

            var counts = new Dictionary<AttendanceStatus, int>
            {
                { AttendanceStatus.Accepté, 0 },
                { AttendanceStatus.Refusé, 0 },
                { AttendanceStatus.EnAttente, 0 }
            };

            foreach (var status in @event.AttendeeStatuses.Values)
            {
                counts[status]++;
            }

            // For attendees without a status entry, count them as Pending
            var pendingCount = @event.Attendees.Count - @event.AttendeeStatuses.Count;
            if (pendingCount > 0)
            {
                counts[AttendanceStatus.EnAttente] += pendingCount;
            }

            return counts;
        }
        
        public async Task<bool> InviteDepartmentAsync(string eventId, string departmentId)
        {
            // Verify event exists
            var @event = await _eventRepository.GetByIdAsync(eventId);
            if (@event == null)
                throw new KeyNotFoundException($"Event with ID {eventId} not found.");
            
            // Parse departmentId to int since Department uses int as ID
            if (!int.TryParse(departmentId, out int deptId))
                throw new ArgumentException("Invalid department ID format");

            // Get all employees in the department
            var employees = await _departmentRepository.GetEmployeesInDepartmentAsync(deptId);
            if (employees == null || !employees.Any())
                return false; // No employees to invite
                
            bool success = true;
            string organizerId = @event.Organizer ?? "System";
            List<string> newlyInvited = new List<string>();

            // Add each employee as an attendee
            foreach (var employee in employees)
            {
                // Skip if employee is already an attendee
                if (@event.Attendees.Contains(employee.Id))
                    continue;
                    
                // Add employee as attendee
                var result = await _eventRepository.AddAttendeeAsync(eventId, employee.Id);
                if (result)
                {
                    newlyInvited.Add(employee.Id);
                }
                else
                {
                    success = false; // Track if any invitation fails
                }
            }

            // Send notifications for newly invited employees for closed events
            if (newlyInvited.Any() && !@event.IsOpenEvent)
            {
                foreach (var invitedId in newlyInvited)
                {
                    await _notificationService.CreateEventInvitationNotificationAsync(organizerId, invitedId, eventId, @event.Title, @event.EventDateTime);
                }
            }

            return success;
        }

        public async Task<bool> InviteMultipleAsync(string eventId, List<string> employeeIds)
        {
            // Verify event exists
            var @event = await _eventRepository.GetByIdAsync(eventId);
            if (@event == null)
                throw new KeyNotFoundException($"Event with ID {eventId} not found.");
            
            if (employeeIds == null || !employeeIds.Any())
                return false; // No employees to invite
                
            bool success = true;
            string organizerId = @event.Organizer ?? "System";
            List<string> newlyInvited = new List<string>();

            // Add each employee as an attendee
            foreach (var employeeId in employeeIds)
            {
                // Verify employee exists (optional, AddAttendeeAsync might handle this)
                // var employee = await _employeeRepository.GetByIdAsync(employeeId);
                // if (employee == null) { success = false; continue; }

                // Skip if employee is already an attendee
                if (@event.Attendees.Contains(employeeId))
                    continue;
                    
                // Add employee as attendee
                var result = await _eventRepository.AddAttendeeAsync(eventId, employeeId);
                if (result)
                {
                    newlyInvited.Add(employeeId);
                }
                else
                {
                    success = false; // Track if any invitation fails
                }
            }

            // Send notifications for newly invited employees for closed events
            if (newlyInvited.Any() && !@event.IsOpenEvent)
            {
                foreach (var invitedId in newlyInvited)
                {
                    await _notificationService.CreateEventInvitationNotificationAsync(organizerId, invitedId, eventId, @event.Title, @event.EventDateTime);
                }
            }

            return success;
        }
        public async Task<IEnumerable<BirthdayResponseDTO>> GetTodaysBirthdaysAsync()
{
    var employees = await _employeeService.GetEmployeesByBirthDateAsync(DateTime.Today);
    return employees.Select(e => new BirthdayResponseDTO
    {
        EmployeeId = e.Id,
        FullName = e.FullName,
        DateOfBirth = e.DateOfBirth,
        Age = DateTime.Today.Year - e.DateOfBirth.Year,
        ProfilePictureUrl = e.ProfilePictureUrl,
        NextBirthday = e.DateOfBirth.AddYears(DateTime.Today.Year - e.DateOfBirth.Year),
        DaysUntilNextBirthday = 0
    });
}

        public async Task<IEnumerable<BirthdayResponseDTO>> GetClosestBirthdaysAsync()
{
    var allEmployees = await _employeeService.GetAllEmployeesAsync();
    var today = DateTime.Today;
    
    var closestBirthdays = allEmployees
        .Select(e => {
            var nextBirthday = e.DateOfBirth.AddYears(today.Year - e.DateOfBirth.Year);
            if (nextBirthday < today)
                nextBirthday = nextBirthday.AddYears(1);
                
            return new BirthdayResponseDTO
            {
                EmployeeId = e.Id,
                FullName = e.FullName,
                DateOfBirth = e.DateOfBirth,
                Age = today.Year - e.DateOfBirth.Year,
                ProfilePictureUrl = e.ProfilePictureUrl,
                NextBirthday = nextBirthday,
                DaysUntilNextBirthday = (nextBirthday - today).Days
            };
        })
        .OrderBy(b => b.DaysUntilNextBirthday)
        .Take(5)
        .ToList();

    return closestBirthdays;
}

    public async Task<IEnumerable<BirthdayEventDTO>> GetBirthdayEventsAsync(int month)
{
    var employees = await _employeeService.GetEmployeesByBirthMonthAsync(month);
    return employees.Select(e => new BirthdayEventDTO
    {
        Title = $"{e.FullName}'s Birthday",
        Date = new DateTime(DateTime.Today.Year, month, e.DateOfBirth.Day),
        EmployeeName = e.FullName,
        TurningAge = DateTime.Today.Year - e.DateOfBirth.Year
    });
}
    }
}