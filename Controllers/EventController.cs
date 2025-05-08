using System.Security.Claims;
using ASTREE_PFE.DTOs;
using ASTREE_PFE.Models;
using ASTREE_PFE.Services.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace ASTREE_PFE.Controllers
{
    /// <summary>
    /// Controller for managing events, including creation, updates, attendee management, and queries.
    /// All endpoints are prefixed with 'api/events'.
    /// </summary>
    [ApiController]
    [Route("api/[controller]")]
    public class EventController : ControllerBase
    {
        private readonly IEventService _eventService;
        private readonly IEmployeeService _employeeService;
        private readonly IGoogleCalendarService _googleCalendarService;
        private readonly ILogger<EventController> _logger;

        /// <summary>
        /// Initializes a new instance of the EventController class.
        /// </summary>
        /// <param name="eventService">Service for managing events</param>
        /// <param name="employeeService">Service for managing employees</param>
        /// <param name="googleCalendarService">Service for Google Calendar integration</param>
        public EventController(
            IEventService eventService,
            IEmployeeService employeeService,
            IGoogleCalendarService googleCalendarService,
            ILogger<EventController> logger
        )
        {
            _eventService = eventService;
            _employeeService = employeeService;
            _googleCalendarService = googleCalendarService;
            _logger = logger;
        }

        /// <summary>
        /// Creates a new event.
        /// </summary>
        /// <param name="eventDto">Event data including title, description, date, etc.</param>
        /// <returns>Newly created event with 201 status on success.</returns>
        [HttpPost("create")]
        public async Task<ActionResult<EventResponseDTO>> CreateEvent(
            [FromBody] EventCreateDTO eventDto
        )
        {
            try
            {
                var result = await _eventService.CreateEventAsync(eventDto);
                return CreatedAtAction(nameof(GetEventById), new { id = result.Id }, result);
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }

        /// <summary>
        /// Retrieves a specific event by its unique ID.
        /// </summary>
        /// <param name="id">Event ID (MongoDB ObjectId format)</param>
        /// <returns>Event details with 200 status, or 404 if not found.</returns>
        [HttpGet("get/{id}")]
        public async Task<ActionResult<EventResponseDTO>> GetEventById(string id)
        {
            try
            {
                var result = await _eventService.GetEventByIdAsync(id);
                return Ok(result);
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(ex.Message);
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }

        /// <summary>
        /// Retrieves all events in the system.
        /// </summary>
        /// <returns>List of all events with 200 status.</returns>
        [HttpGet("all")]
        public async Task<ActionResult<IEnumerable<EventResponseDTO>>> GetAllEvents()
        {
            try
            {
                var events = await _eventService.GetAllEventsAsync();
                return Ok(events);
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }

        /// <summary>
        /// Updates an existing event.
        /// </summary>
        /// <param name="id">Event ID to update</param>
        /// <param name="eventDto">Updated event data (partial updates supported)</param>
        /// <returns>Updated event with 200 status, or 404 if event not found.</returns>
        [HttpPut("update/{id}")]
        public async Task<ActionResult<EventResponseDTO>> UpdateEvent(
            string id,
            [FromBody] EventUpdateDTO eventDto
        )
        {
            try
            {
                var existingEvent = await _eventService.GetEventByIdAsync(id);
                if (existingEvent == null)
                    return NotFound($"Event with ID {id} not found.");

                // Check if the current user is the organizer
                var currentUser = HttpContext.User;
                var currentUserId = currentUser.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (existingEvent.Organizer != currentUserId)
                    return Forbid("Only the event organizer can update this event.");

                var result = await _eventService.UpdateEventAsync(id, eventDto);
                return Ok(result);
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(ex.Message);
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }

        /// <summary>
        /// Deletes an event permanently.
        /// </summary>
        /// <param name="id">Event ID to delete</param>
        /// <returns>204 No Content on success, 404 if event not found.</returns>
        [HttpDelete("delete/{id}")]
        public async Task<ActionResult> DeleteEvent(string id)
        {
            try
            {
                var existingEvent = await _eventService.GetEventByIdAsync(id);
                if (existingEvent == null)
                    return NotFound($"Event with ID {id} not found.");

                // Check if the current user is the organizer
                var currentUser = HttpContext.User;
                var currentUserId = currentUser.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (existingEvent.Organizer != currentUserId)
                    return Forbid("Only the event organizer can delete this event.");

                var result = await _eventService.DeleteEventAsync(id);
                if (!result)
                    return NotFound($"Event with ID {id} not found.");
                return NoContent();
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }

        /// <summary>
        /// Adds an attendee to a restricted event.
        /// </summary>
        /// <param name="eventId">Event ID</param>
        /// <param name="attendeeDto">Contains employeeId of attendee</param>
        /// <returns>200 OK on success, 400 if event is open to all.</returns>
        [HttpPost("add-attendee/{eventId}")]
        public async Task<ActionResult> AddAttendee(
            string eventId,
            [FromBody] AttendeeUpdateDTO attendeeDto
        )
        {
            try
            {
                var result = await _eventService.AddAttendeeAsync(eventId, attendeeDto.EmployeeId);
                if (!result)
                    return BadRequest("Failed to add attendee.");

                // Get employee email for Google Calendar integration
                var employee = await _employeeService.GetEmployeeByIdAsync(attendeeDto.EmployeeId);
                if (employee != null)
                {
                    await _googleCalendarService.AddEventToAttendeeCalendarAsync(
                        eventId,
                        employee.Email
                    );
                }

                return Ok();
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(ex.Message);
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }

        /// <summary>
        /// Gets the attendance status counts for an event.
        /// </summary>
        /// <param name="eventId">Event ID</param>
        /// <returns>Dictionary of attendance status counts with 200 status, or 404 if event not found.</returns>
        [HttpGet("{eventId}/attendance-counts")]
        public async Task<
            ActionResult<Dictionary<AttendanceStatus, int>>
        > GetAttendanceStatusCounts(string eventId)
        {
            try
            {
                var counts = await _eventService.GetAttendanceStatusCountsAsync(eventId);
                return Ok(counts);
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(ex.Message);
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }

        [HttpGet("{eventId}/user/{userId}/attendance-status")]
        public async Task<ActionResult<AttendanceStatusResponseDTO>> GetUserAttendanceStatus(
            string eventId,
            string userId
        )
        {
            try
            {
                var @event = await _eventService.GetEventByIdAsync(eventId);
                if (!@event.Attendees.Contains(userId))
                    return NotFound($"User with ID {userId} is not an attendee of this event.");

                var status = @event.AttendeeStatuses.GetValueOrDefault(
                    userId,
                    AttendanceStatus.EnAttente
                );
                var isFinal = @event.AttendeeStatusFinal.GetValueOrDefault(userId, false);

                return Ok(
                    new AttendanceStatusResponseDTO
                    {
                        EventId = eventId,
                        EmployeeId = userId,
                        Status = status,
                        IsFinal = isFinal,
                    }
                );
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(ex.Message);
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }

        /// <summary>
        /// Gets the attendance status for a specific attendee in an event.
        /// </summary>
        /// <param name="eventId">Event ID</param>
        /// <param name="employeeId">Employee ID</param>
        /// <returns>Attendance status details with 200 status, or 404 if not found.</returns>
        [HttpGet("{eventId}/attendee/{employeeId}/status")]
        public async Task<ActionResult<AttendanceStatusResponseDTO>> GetAttendanceStatus(
            string eventId,
            string employeeId
        )
        {
            try
            {
                var @event = await _eventService.GetEventByIdAsync(eventId);
                if (!@event.Attendees.Contains(employeeId))
                    return NotFound(
                        $"Employee with ID {employeeId} is not an attendee of this event."
                    );

                var status = @event.AttendeeStatuses.GetValueOrDefault(
                    employeeId,
                    AttendanceStatus.EnAttente
                );
                var isFinal = @event.AttendeeStatusFinal.GetValueOrDefault(employeeId, false);

                var response = new AttendanceStatusResponseDTO
                {
                    EventId = eventId,
                    EmployeeId = employeeId,
                    Status = status,
                    IsFinal = isFinal,
                };

                return Ok(response);
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(ex.Message);
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }

        /// <summary>
        /// Removes an attendee from an event.
        /// </summary>
        /// <param name="eventId">Event ID</param>
        /// <param name="employeeId">Employee ID to remove</param>
        /// <returns>200 OK on success, 404 if event/attendee not found.</returns>
        [HttpDelete("remove-attendee/{eventId}/{employeeId}")]
        public async Task<ActionResult> RemoveAttendee(string eventId, string employeeId)
        {
            try
            {
                var result = await _eventService.RemoveAttendeeAsync(eventId, employeeId);
                if (result)
                    return Ok();
                return BadRequest("Failed to remove attendee.");
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(ex.Message);
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }

        /// <summary>
        /// Updates an attendee's status for an event (Accept or Decline).
        /// </summary>
        /// <param name="eventId">Event ID</param>
        /// <param name="employeeId">Employee ID of the attendee</param>
        /// <param name="status">New attendance status (Accepted or Declined)</param>
        /// <returns>200 OK on success, 404 if event or attendee not found.</returns>
        [HttpPut("{eventId}/attendee/{employeeId}/status")]
        public async Task<ActionResult> UpdateAttendanceStatus(
            string eventId,
            string employeeId,
            [FromBody] AttendanceStatusUpdateDTO statusDto
        )
        {
            try
            {
                var result = await _eventService.UpdateAttendanceStatusAsync(
                    eventId,
                    employeeId,
                    statusDto.Status
                );
                if (result)
                    return Ok();
                return BadRequest("Failed to update attendance status.");
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(ex.Message);
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }

        /// <summary>
        /// Retrieves all upcoming events (events with future dates).
        /// </summary>
        /// <returns>List of upcoming events with 200 status.</returns>
        [HttpGet("upcoming")]
        public async Task<ActionResult<IEnumerable<EventResponseDTO>>> GetUpcomingEvents()
        {
            try
            {
                var events = await _eventService.GetUpcomingEventsAsync();
                return Ok(events);
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }

        /// <summary>
        /// Retrieves all events organized by a specific employee.
        /// </summary>
        /// <param name="organizerId">Employee ID of the organizer</param>
        /// <returns>List of events with 200 status.</returns>
        [HttpGet("by-organizer/{organizerId}")]
        public async Task<ActionResult<IEnumerable<EventResponseDTO>>> GetEventsByOrganizer(
            string organizerId
        )
        {
            try
            {
                var events = await _eventService.GetEventsByOrganizerAsync(organizerId);
                return Ok(events);
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }

        /// <summary>
        /// Retrieves events filtered by category.
        /// </summary>
        /// <param name="category">Event category (Meeting, Training, etc.)</param>
        /// <returns>List of events with 200 status.</returns>
        [HttpGet("by-category/{category}")]
        public async Task<ActionResult<IEnumerable<EventResponseDTO>>> GetEventsByCategory(
            EventCategory category
        )
        {
            try
            {
                var events = await _eventService.GetEventsByCategoryAsync(category);
                return Ok(events);
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }

        /// <summary>
        /// Retrieves all open events (events that don't require attendee registration).
        /// </summary>
        /// <returns>List of open events with 200 status.</returns>
        [HttpGet("open-events")]
        public async Task<ActionResult<IEnumerable<EventResponseDTO>>> GetOpenEvents()
        {
            try
            {
                var events = await _eventService.GetOpenEventsAsync();
                return Ok(events);
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }

        /// <summary>
        /// Updates an event's status (Upcoming, Ongoing, Completed).
        /// </summary>
        /// <param name="eventId">Event ID to update</param>
        /// <param name="status">New status</param>
        /// <returns>200 OK on success, 404 if event not found.</returns>
        [HttpPut("update-status/{eventId}")]
        public async Task<ActionResult> UpdateEventStatus(
            string eventId,
            [FromBody] EventStatus status
        )
        {
            try
            {
                var result = await _eventService.UpdateEventStatusAsync(eventId, status);
                if (result)
                    return Ok();
                return BadRequest("Failed to update event status.");
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(ex.Message);
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }

        /// <summary>
        /// Retrieves all events a specific employee is attending.
        /// </summary>
        /// <param name="employeeId">Employee ID</param>
        /// <returns>List of events with 200 status.</returns>
        [HttpGet("by-attendee/{employeeId}")]
        public async Task<ActionResult<IEnumerable<EventResponseDTO>>> GetEventsByAttendee(
            string employeeId
        )
        {
            try
            {
                var events = await _eventService.GetEventsByAttendeeAsync(employeeId);
                return Ok(events);
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }

        /// <summary>
        /// Generates birthday events for all employees in the system.
        /// </summary>
        /// <returns>200 OK on success, 400 if generation fails.</returns>
        [HttpPost("generate-birthdays")]
        public async Task<ActionResult> GenerateBirthdayEvents()
        {
            try
            {
                // Prevent duplicate birthday events
                var allEvents = await _eventService.GetAllEventsAsync();
                // Assuming EventResponseDTO has a property to identify birthday events, e.g., IsBirthdayEvent or Category
                bool birthdayEventsExist = allEvents.Any(e =>
                    e.Category == EventCategory.Anniversaire
                );
                if (birthdayEventsExist)
                {
                    return BadRequest(
                        "Birthday events already exist. Generation aborted to prevent duplicates."
                    );
                }
                await _eventService.GenerateBirthdayEventsAsync();
                return Ok("Birthday events generated successfully.");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to generate birthday events");
                return BadRequest($"Failed to generate birthday events: {ex.Message}");
            }
        }

        /// <summary>
        /// Invites all employees from a department to an event.
        /// </summary>
        /// <param name="eventId">Event ID</param>
        /// <param name="departmentId">Department ID</param>
        /// <returns>200 OK on success, 404 if event/department not found.</returns>
        [HttpPost("invite-department/{eventId}/{departmentId}")]
        public async Task<ActionResult> InviteDepartment(string eventId, string departmentId)
        {
            try
            {
                // Check if event exists
                var existingEvent = await _eventService.GetEventByIdAsync(eventId);
                if (existingEvent == null)
                    return NotFound($"Event with ID {eventId} not found.");

                // Check if current user is the organizer
                var currentUser = HttpContext.User;
                var currentUserId = currentUser.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (existingEvent.Organizer != currentUserId)
                    return Forbid("Only the event organizer can invite departments.");

                var result = await _eventService.InviteDepartmentAsync(eventId, departmentId);
                if (result)
                    return Ok();
                return BadRequest("Failed to invite department.");
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(ex.Message);
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }

        /// <summary>
        /// Invites multiple employees to an event.
        /// </summary>
        /// <param name="eventId">Event ID</param>
        /// <param name="employeeIds">List of employee IDs to invite</param>
        /// <returns>200 OK on success, 404 if event not found, 403 if user is not the organizer.</returns>
        [HttpPost("{eventId}/invite-multiple")]
        public async Task<ActionResult> InviteMultiple(
            string eventId,
            [FromBody] List<string> employeeIds
        )
        {
            try
            {
                // Debug log: log received payload
                Console.WriteLine(
                    $"[InviteMultiple] eventId: {eventId}, employeeIds: {string.Join(",", employeeIds ?? new List<string>())}"
                );
                // Check if event exists
                var existingEvent = await _eventService.GetEventByIdAsync(eventId);
                if (existingEvent == null)
                    return NotFound($"Event with ID {eventId} not found.");

                // Check if current user is the organizer
                var currentUser = HttpContext.User;
                var currentUserId = currentUser.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (existingEvent.Organizer != currentUserId)
                    return Forbid("Only the event organizer can invite multiple employees.");

                if (employeeIds == null || !employeeIds.Any())
                    return BadRequest("No employee IDs provided.");

                var result = await _eventService.InviteMultipleAsync(eventId, employeeIds);
                if (result)
                    return Ok();
                return BadRequest("Some invitations failed to send.");
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(ex.Message);
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }

        /// <summary>
        /// Invites all employees in the system to an event.
        /// </summary>
        /// <param name="eventId">Event ID</param>
        /// <returns>200 OK on success, 404 if event not found.</returns>
        [HttpPost("{eventId}/invite-all")]
        public async Task<ActionResult> InviteAll(string eventId)
        {
            try
            {
                // Check if event exists
                var existingEvent = await _eventService.GetEventByIdAsync(eventId);
                if (existingEvent == null)
                    return NotFound($"Event with ID {eventId} not found.");

                // Check if current user is the organizer
                var currentUser = HttpContext.User;
                var currentUserId = currentUser.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (existingEvent.Organizer != currentUserId)
                    return Forbid("Only the event organizer can invite all employees.");

                // Get all employees and add them as attendees
                var employees = await _employeeService.GetAllEmployeesAsync();
                bool success = true;

                foreach (var employee in employees)
                {
                    // Skip if employee is already an attendee
                    if (existingEvent.Attendees.Contains(employee.Id))
                        continue;

                    // Add employee as attendee
                    var result = await _eventService.AddAttendeeAsync(eventId, employee.Id);
                    if (!result)
                        success = false; // Track if any invitation fails
                }

                if (success)
                    return Ok();
                return BadRequest("Some invitations failed to send.");
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(ex.Message);
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }

        [HttpGet("birthdays/{month}")]
        public async Task<IActionResult> GetBirthdaysByMonth(int month)
        {
            try
            {
                var birthdays = await _eventService.GetBirthdayEventsAsync(month);
                return Ok(birthdays);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = ex.Message });
            }
        }

        [HttpGet("birthdays/today")]
        public async Task<IActionResult> GetTodaysBirthdays()
        {
            try
            {
                var todaysBirthdays = await _eventService.GetTodaysBirthdaysAsync();
                return Ok(todaysBirthdays);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = ex.Message });
            }
        }

        [HttpGet("birthdays/closest")]
        public async Task<IActionResult> GetClosestBirthdays()
        {
            try
            {
                var closestBirthdays = await _eventService.GetClosestBirthdaysAsync();
                return Ok(closestBirthdays);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = ex.Message });
            }
        }
    }
}
