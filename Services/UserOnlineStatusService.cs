using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using ASTREE_PFE.Models;
using ASTREE_PFE.Services.Interfaces;
using MongoDB.Driver;

namespace ASTREE_PFE.Services
{
    public class UserOnlineStatusService : IUserOnlineStatusService
    {
        private readonly IMongoCollection<UserOnlineStatus> _userOnlineStatusCollection;

        public UserOnlineStatusService(IMongoDatabase database)
        {
            _userOnlineStatusCollection = database.GetCollection<UserOnlineStatus>("UserOnlineStatus");
        }

        public async Task<IEnumerable<UserOnlineStatus>> GetAllOnlineUsersAsync()
        {
            return await _userOnlineStatusCollection.Find(u => u.IsOnline).ToListAsync();
        }

        public async Task<UserOnlineStatus> GetUserStatusAsync(string userId)
        {
            return await _userOnlineStatusCollection.Find(u => u.UserId == userId).FirstOrDefaultAsync();
        }

        public async Task<DateTime?> GetLastSeenTimeAsync(string userId)
        {
            var userStatus = await _userOnlineStatusCollection.Find(u => u.UserId == userId).FirstOrDefaultAsync();
            return userStatus?.LastSeenTime;
        }

        public async Task UpdateUserStatusAsync(string userId, bool isOnline)
        {
            var filter = Builders<UserOnlineStatus>.Filter.Eq(u => u.UserId, userId);
            var update = Builders<UserOnlineStatus>.Update
                .Set(u => u.IsOnline, isOnline)
                .Set(u => u.LastSeenTime, DateTime.UtcNow);

            await _userOnlineStatusCollection.UpdateOneAsync(filter, update, new UpdateOptions { IsUpsert = true });
        }

        public async Task UpdateLastActivityAsync(string userId)
        {
            var filter = Builders<UserOnlineStatus>.Filter.Eq(u => u.UserId, userId);
            var update = Builders<UserOnlineStatus>.Update
                .Set(u => u.LastActivityTime, DateTime.UtcNow);

            await _userOnlineStatusCollection.UpdateOneAsync(filter, update, new UpdateOptions { IsUpsert = true });
        }
    }
}