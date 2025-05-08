using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using ASTREE_PFE.Data;
using ASTREE_PFE.Models;
using ASTREE_PFE.Repositories.Interfaces;
using ASTREE_PFE.Services.Interfaces;
using MongoDB.Bson;
using MongoDB.Driver;

namespace ASTREE_PFE.Repositories
{
    public class NotificationRepository : INotificationRepository
    {
        private readonly IMongoCollection<Notification> _notifications;

        public NotificationRepository(IMongoDatabase database)
        {
            _notifications = database.GetCollection<Notification>("Notifications");
        }

        public async Task<IEnumerable<Notification>> GetAllAsync()
        {
            return await _notifications.Find(_ => true).ToListAsync();
        }

        public async Task<Notification> GetByIdAsync(string id)
        {
            return await _notifications.Find(n => n.Id == id).FirstOrDefaultAsync();
        }

        public async Task<IEnumerable<Notification>> GetUnreadNotificationsAsync(string recipientId)
        {
            var filter = Builders<Notification>.Filter.And(
                Builders<Notification>.Filter.Eq(n => n.RecipientId, recipientId),
                Builders<Notification>.Filter.Eq(n => n.IsRead, false)
            );
            return await _notifications.Find(filter).ToListAsync();
        }

        public async Task<IEnumerable<Notification>> GetNotificationsForUserAsync(
            string userId,
            int skip = 0,
            int take = 20
        )
        {
            return await _notifications
                .Find(n => n.RecipientId == userId)
                .SortByDescending(n => n.Timestamp)
                .Skip(skip)
                .Limit(take)
                .ToListAsync();
        }

        public async Task<int> GetUnreadCountAsync(string userId)
        {
            return (int)
                await _notifications.CountDocumentsAsync(n => n.RecipientId == userId && !n.IsRead);
        }

        public async Task CreateAsync(Notification notification)
        {
            await _notifications.InsertOneAsync(notification);
        }

        public async Task MarkAsReadAsync(string id)
        {
            var filter = Builders<Notification>.Filter.Eq(n => n.Id, id);
            var update = Builders<Notification>.Update.Set(n => n.IsRead, true);
            await _notifications.UpdateOneAsync(filter, update);
        }

        public async Task MarkAllAsReadAsync(string recipientId)
        {
            var filter = Builders<Notification>.Filter.And(
                Builders<Notification>.Filter.Eq(n => n.RecipientId, recipientId),
                Builders<Notification>.Filter.Eq(n => n.IsRead, false)
            );
            var update = Builders<Notification>.Update.Set(n => n.IsRead, true);
            await _notifications.UpdateManyAsync(filter, update);
        }

        public async Task DeleteAsync(string id)
        {
            await _notifications.DeleteOneAsync(n => n.Id == id);
        }

        public async Task DeleteAllForUserAsync(string userId)
        {
            await _notifications.DeleteManyAsync(n => n.RecipientId == userId);
        }
    }
}
