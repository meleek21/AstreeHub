using ASTREE_PFE.Models;
using ASTREE_PFE.Repositories.Interfaces;
using MongoDB.Driver;

namespace ASTREE_PFE.Repositories
{
    public class EventRepository : MongoRepository<Event>, IEventRepository
    {
        public async Task<bool> ExistsForEmployeeAsync(string employeeId, DateTime eventDate)
        {
            return await _events
                .Find(e => e.AssociatedEmployeeId == employeeId 
                    && e.EventDateTime.Date == eventDate.Date)
                .AnyAsync();
        }
        private readonly IMongoCollection<Event> _events;

        public EventRepository(IMongoDatabase database) : base(database, "Events")
        {
            _events = database.GetCollection<Event>("Events");
        }

        public async Task<IEnumerable<Event>> GetUpcomingEventsAsync()
        {
            var filter = Builders<Event>.Filter.And(
                Builders<Event>.Filter.Eq(e => e.Status, EventStatus.Upcoming),
                Builders<Event>.Filter.Gt(e => e.EventDateTime, DateTime.UtcNow)
            );
            return await _events.Find(filter).ToListAsync();
        }

        public async Task<IEnumerable<Event>> GetBirthdayEventsAsync(int month)
        {
            var filter = Builders<Event>.Filter.And(
                Builders<Event>.Filter.Eq(e => e.Type, EventType.Birthday),
                Builders<Event>.Filter.Gte(e => e.EventDateTime, new DateTime(DateTime.Now.Year, month, 1)) & Builders<Event>.Filter.Lt(e => e.EventDateTime, new DateTime(DateTime.Now.Year, month, 1).AddMonths(1))
            );
            return await _events.Find(filter).ToListAsync();
        }

        public async Task<IEnumerable<Event>> GetEventsByOrganizerAsync(string organizerId)
        {
            var filter = Builders<Event>.Filter.Eq(e => e.Organizer, organizerId);
            return await _events.Find(filter).ToListAsync();
        }

       

        public async Task<IEnumerable<Event>> GetEventsByAttendeeAsync(string employeeId)
        {
            var filter = Builders<Event>.Filter.AnyEq(e => e.Attendees, employeeId);
            return await _events.Find(filter).ToListAsync();
        }

       

        public async Task<bool> AddAttendeeAsync(string eventId, string employeeId)
        {
            var filter = Builders<Event>.Filter.Eq(e => e.Id, eventId);
            var updates = Builders<Event>.Update.Combine(
                Builders<Event>.Update.AddToSet(e => e.Attendees, employeeId),
                Builders<Event>.Update.Set(e => e.AttendeeStatuses[employeeId], AttendanceStatus.Pending)
            );
            var result = await _events.UpdateOneAsync(filter, updates);
            return result.ModifiedCount > 0;
        }

        public async Task<bool> RemoveAttendeeAsync(string eventId, string employeeId)
        {
            var filter = Builders<Event>.Filter.Eq(e => e.Id, eventId);
            var updates = Builders<Event>.Update.Combine(
                Builders<Event>.Update.Pull(e => e.Attendees, employeeId),
                Builders<Event>.Update.Unset($"attendeeStatuses.{employeeId}")
            );
            var result = await _events.UpdateOneAsync(filter, updates);
            return result.ModifiedCount > 0;
        }

        public async Task<bool> UpdateEventStatusAsync(string eventId, EventStatus status)
        {
            var filter = Builders<Event>.Filter.Eq(e => e.Id, eventId);
            var update = Builders<Event>.Update.Set(e => e.Status, status);
            var result = await _events.UpdateOneAsync(filter, update);
            return result.ModifiedCount > 0;
        }

        public async Task<bool> UpdateAttendanceStatusAsync(string eventId, string employeeId, AttendanceStatus status)
        {
            var filter = Builders<Event>.Filter.Eq(e => e.Id, eventId);
            var update = Builders<Event>.Update.Set(e => e.AttendeeStatuses[employeeId], status);
            var result = await _events.UpdateOneAsync(filter, update);
            return result.ModifiedCount > 0;
        }

        public async Task<bool> UpdateAttendeeStatusFinalAsync(string eventId, Dictionary<string, bool> statusFinalUpdates)
        {
            var filter = Builders<Event>.Filter.Eq(e => e.Id, eventId);
            var updates = new List<UpdateDefinition<Event>>();

            foreach (var kvp in statusFinalUpdates)
            {
                updates.Add(Builders<Event>.Update.Set(e => e.AttendeeStatusFinal[kvp.Key], kvp.Value));
            }

            var combinedUpdate = Builders<Event>.Update.Combine(updates);
            var result = await _events.UpdateOneAsync(filter, combinedUpdate);
            return result.ModifiedCount > 0;
        }

        public async Task<IEnumerable<Event>> GetEventsByCategoryAsync(EventCategory category)
        {
            var filter = Builders<Event>.Filter.Eq(e => e.Category, category);
            return await _events.Find(filter).ToListAsync();
        }

        

        public async Task<IEnumerable<Event>> GetOpenEventsAsync()
        {
            var filter = Builders<Event>.Filter.Eq(e => e.IsOpenEvent, true);
            return await _events.Find(filter).ToListAsync();
        }

       








    }
}