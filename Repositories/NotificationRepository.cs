using ASTREE_PFE.Models;
using MongoDB.Driver;

namespace ASTREE_PFE.Repositories
{
    public class NotificationRepository : MongoRepository<Notification>, INotificationRepository
    {
        public NotificationRepository(IMongoDatabase database) 
            : base(database, "Notifications")
        {
        }

        public async Task<IEnumerable<Notification>> GetUnreadNotificationsAsync(string recipientId)
        {
            var filter = Builders<Notification>.Filter.And(
                Builders<Notification>.Filter.Eq(n => n.RecipientId, recipientId),
                Builders<Notification>.Filter.Eq(n => n.IsRead, false)
            );
            return await GetCollection().Find(filter).ToListAsync();
        }

        public async Task MarkAsReadAsync(string id)
        {
            var filter = Builders<Notification>.Filter.Eq(n => n.Id, id);
            var update = Builders<Notification>.Update.Set(n => n.IsRead, true);
            await GetCollection().UpdateOneAsync(filter, update);
        }

        public async Task MarkAllAsReadAsync(string recipientId)
        {
            var filter = Builders<Notification>.Filter.And(
                Builders<Notification>.Filter.Eq(n => n.RecipientId, recipientId),
                Builders<Notification>.Filter.Eq(n => n.IsRead, false)
            );
            var update = Builders<Notification>.Update.Set(n => n.IsRead, true);
            await GetCollection().UpdateManyAsync(filter, update);
        }
    }
}