
using ASTREE_PFE.Services.Interfaces;
using Google.Apis.Auth.OAuth2;
using Google.Apis.Calendar.v3;
using Google.Apis.Calendar.v3.Data;
using Google.Apis.Services;
using GoogleEvent = Google.Apis.Calendar.v3.Data.Event;
using LocalEvent = ASTREE_PFE.Models.Event;

namespace ASTREE_PFE.Services
{
    public class GoogleCalendarService : IGoogleCalendarService
    {
        private readonly IConfiguration _configuration;
        private readonly IEventService _eventService;
        private readonly CalendarService _calendarService;

        public GoogleCalendarService(IConfiguration configuration, IEventService eventService)
        {
            _configuration = configuration;
            _eventService = eventService;

            // Get the application root path
            var rootPath = Directory.GetCurrentDirectory();

            // Get credentials path from configuration
            var credentialsConfigPath = _configuration["GoogleCalendar:CredentialsPath"];
            if (string.IsNullOrEmpty(credentialsConfigPath))
            {
                Console.WriteLine("Google Calendar credentials path is not configured");
                _calendarService = null;
                return;
            }

            // Construct full path for credentials
            var credentialsPath = Path.Combine(rootPath, credentialsConfigPath);

            // Verify credentials file exists
            if (!System.IO.File.Exists(credentialsPath))
            {
                Console.WriteLine($"Google Calendar credentials not found at: {credentialsPath}");
                _calendarService = null;
                return;
            }

            try
            {
                var credential = GoogleCredential
                    .FromFile(credentialsPath)
                    .CreateScoped(CalendarService.Scope.Calendar);

                _calendarService = new CalendarService(
                    new BaseClientService.Initializer
                    {
                        HttpClientInitializer = credential,
                        ApplicationName = "ASTREE Enterprise Social Network",
                    }
                );
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Failed to initialize Google Calendar service: {ex.Message}");
                _calendarService = null;
            }
        }

        public async Task<string> AddEventToGoogleCalendar(LocalEvent eventToAdd)
        {
            // Check if Google Calendar service is available
            if (_calendarService == null)
            {
                // Return empty string or some indicator that Google Calendar is not available
                return string.Empty;
            }

            try
            {
                var calendarEvent = new GoogleEvent
                {
                    Summary = eventToAdd.Title,
                    Description = eventToAdd.Description,
                    Start = new EventDateTime { DateTime = eventToAdd.EventDateTime },
                    End = new EventDateTime { DateTime = eventToAdd.EventDateTime.AddHours(1) },
                    Location = eventToAdd.Location,
                    Attendees = eventToAdd
                        .Attendees?.Select(email => new EventAttendee { Email = email })
                        .ToList(),
                };

                var createdEvent = await _calendarService
                    .Events.Insert(calendarEvent, "primary")
                    .ExecuteAsync();
                return createdEvent.Id;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error adding event to Google Calendar: {ex.Message}");
                return string.Empty;
            }
        }

        public async Task<bool> AddEventToAttendeeCalendarAsync(
            string eventId,
            string attendeeEmail
        )
        {
            // Check if Google Calendar service is available
            if (_calendarService == null)
            {
                return false;
            }

            try
            {
                // Get the event details
                var eventDetails = await _eventService.GetEventByIdAsync(eventId);
                if (eventDetails == null)
                    return false;

                // Get Google Calendar event ID or create a new one if it doesn't exist
                string googleEventId = await GetGoogleCalendarEventId(eventId);
                if (string.IsNullOrEmpty(googleEventId))
                {
                    var localEvent = new LocalEvent
                    {
                        Id = eventId,
                        Title = eventDetails.Title,
                        Description = eventDetails.Description,
                        EventDateTime = eventDetails.EventDateTime,
                        Location = eventDetails.Location,
                    };
                    googleEventId = await AddEventToGoogleCalendar(localEvent);

                    // If we couldn't create the event in Google Calendar, return false
                    if (string.IsNullOrEmpty(googleEventId))
                        return false;
                }

                // Add the attendee to the Google Calendar event
                var calendarEvent = await _calendarService
                    .Events.Get("primary", googleEventId)
                    .ExecuteAsync();

                // Initialize attendees list if null
                if (calendarEvent.Attendees == null)
                    calendarEvent.Attendees = new List<EventAttendee>();

                // Add the new attendee if not already in the list
                if (!calendarEvent.Attendees.Any(a => a.Email == attendeeEmail))
                {
                    calendarEvent.Attendees.Add(new EventAttendee { Email = attendeeEmail });
                    await _calendarService
                        .Events.Update(calendarEvent, "primary", googleEventId)
                        .ExecuteAsync();
                }

                return true;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error adding attendee to Google Calendar event: {ex.Message}");
                return false;
            }
        }

        public async Task<bool> UpdateEventInGoogleCalendar(
            string googleEventId,
            LocalEvent updatedEvent
        )
        {
            // Check if Google Calendar service is available
            if (_calendarService == null)
            {
                return false;
            }

            try
            {
                var calendarEvent = new GoogleEvent
                {
                    Summary = updatedEvent.Title,
                    Description = updatedEvent.Description,
                    Start = new EventDateTime { DateTime = updatedEvent.EventDateTime },
                    End = new EventDateTime { DateTime = updatedEvent.EventDateTime.AddHours(1) },
                    Location = updatedEvent.Location,
                    Attendees = updatedEvent
                        .Attendees?.Select(email => new EventAttendee { Email = email })
                        .ToList(),
                };

                await _calendarService
                    .Events.Update(calendarEvent, "primary", googleEventId)
                    .ExecuteAsync();
                return true;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error updating event in Google Calendar: {ex.Message}");
                return false;
            }
        }

        public async Task<bool> DeleteEventFromGoogleCalendar(string googleEventId)
        {
            // Check if Google Calendar service is available
            if (_calendarService == null)
            {
                return false;
            }

            try
            {
                await _calendarService.Events.Delete("primary", googleEventId).ExecuteAsync();
                return true;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error deleting event from Google Calendar: {ex.Message}");
                return false;
            }
        }

        public async Task<string> GetGoogleCalendarEventId(string eventId)
        {
            // Check if Google Calendar service is available
            if (_calendarService == null)
            {
                return string.Empty;
            }

            try
            {
                var events = await _calendarService.Events.List("primary").ExecuteAsync();
                var calendarEvent = events.Items.FirstOrDefault(e =>
                    e.Description?.Contains(eventId) ?? false
                );
                return calendarEvent?.Id;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error getting Google Calendar event ID: {ex.Message}");
                return string.Empty;
            }
        }
    }
}
