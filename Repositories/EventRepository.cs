using ASTREE_PFE.Models;
using ASTREE_PFE.Repositories.Interfaces;
using MongoDB.Driver;

namespace ASTREE_PFE.Repositories
{
    public class EventRepository : MongoRepository<Event>, IEventRepository
    {
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
            var update = Builders<Event>.Update.AddToSet(e => e.Attendees, employeeId);
            var result = await _events.UpdateOneAsync(filter, update);
            return result.ModifiedCount > 0;
        }

        public async Task<bool> RemoveAttendeeAsync(string eventId, string employeeId)
        {
            var filter = Builders<Event>.Filter.Eq(e => e.Id, eventId);
            var update = Builders<Event>.Update.Pull(e => e.Attendees, employeeId);
            var result = await _events.UpdateOneAsync(filter, update);
            return result.ModifiedCount > 0;
        }

        public async Task<bool> UpdateEventStatusAsync(string eventId, EventStatus status)
        {
            var filter = Builders<Event>.Filter.Eq(e => e.Id, eventId);
            var update = Builders<Event>.Update.Set(e => e.Status, status);
            var result = await _events.UpdateOneAsync(filter, update);
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