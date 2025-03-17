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
        private readonly IMongoCollection<UserOnlineStatus> _userStatusCollection;

        public UserOnlineStatusService(IMongoDatabase database)
        {
            _userStatusCollection = database.GetCollection<UserOnlineStatus>("UserOnlineStatus");
        }

        public async Task<UserOnlineStatus> GetUserStatusAsync(string userId)
        {
            return await _userStatusCollection.Find(x => x.UserId == userId).FirstOrDefaultAsync();
        }

        public async Task<IEnumerable<UserOnlineStatus>> GetAllOnlineUsersAsync()
        {
            return await _userStatusCollection.Find(x => x.IsOnline).ToListAsync();
        }

        public async Task UpdateUserStatusAsync(string userId, bool isOnline)
        {
            try
            {
                var status = await GetUserStatusAsync(userId);
                var currentTime = DateTime.UtcNow;

                if (status == null)
                {
                    status = new UserOnlineStatus
                    {
                        UserId = userId,
                        IsOnline = isOnline,
                        LastActivityTime = currentTime,
                        LastSeenTime = currentTime
                    };
                    await _userStatusCollection.InsertOneAsync(status);
                    Console.WriteLine($"Created new online status for user {userId}");
                }
                else
                {
                    var update = Builders<UserOnlineStatus>.Update
                        .Set(x => x.IsOnline, isOnline)
                        .Set(x => x.LastActivityTime, currentTime);

                    if (!isOnline)
                    {
                        update = update.Set(x => x.LastSeenTime, currentTime);
                    }

                    var result = await _userStatusCollection.UpdateOneAsync(x => x.UserId == userId, update);
                    Console.WriteLine($"Updated online status for user {userId}. Modified: {result.ModifiedCount}");
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error updating user online status: {ex.Message}");
                throw;
            }
        }

        public async Task UpdateLastActivityAsync(string userId)
        {
            var update = Builders<UserOnlineStatus>.Update
                .Set(x => x.LastActivityTime, DateTime.UtcNow);

            await _userStatusCollection.UpdateOneAsync(x => x.UserId == userId, update);
        }

        public async Task<DateTime?> GetLastSeenTimeAsync(string userId)
        {
            var status = await GetUserStatusAsync(userId);
            return status?.LastSeenTime;
        }
    }
}