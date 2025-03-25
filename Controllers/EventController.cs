using Microsoft.AspNetCore.Mvc;
using ASTREE_PFE.DTOs;
using ASTREE_PFE.Services.Interfaces;
using ASTREE_PFE.Models;

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

        public EventController(IEventService eventService)
        {
            _eventService = eventService;
        }

        /// <summary>
        /// Creates a new event.
        /// </summary>
        /// <param name="eventDto">Event data including title, description, date, etc.</param>
        /// <returns>Newly created event with 201 status on success.</returns>
        [HttpPost("create")]
        public async Task<ActionResult<EventResponseDTO>> CreateEvent([FromBody] EventCreateDTO eventDto)
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
        public async Task<ActionResult<EventResponseDTO>> UpdateEvent(string id, [FromBody] EventUpdateDTO eventDto)
        {
            try
            {
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
        public async Task<ActionResult> AddAttendee(string eventId, [FromBody] AttendeeUpdateDTO attendeeDto)
        {
            try
            {
                var result = await _eventService.AddAttendeeAsync(eventId, attendeeDto.EmployeeId);
                if (result)
                    return Ok();
                return BadRequest("Failed to add attendee.");
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
        public async Task<ActionResult<IEnumerable<EventResponseDTO>>> GetEventsByOrganizer(string organizerId)
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
        public async Task<ActionResult<IEnumerable<EventResponseDTO>>> GetEventsByCategory(EventCategory category)
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
        public async Task<ActionResult> UpdateEventStatus(string eventId, [FromBody] EventStatus status)
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
        public async Task<ActionResult<IEnumerable<EventResponseDTO>>> GetEventsByAttendee(string employeeId)
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
    }
}