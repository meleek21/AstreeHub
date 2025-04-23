using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using ASTREE_PFE.Models;
using ASTREE_PFE.Services.Interfaces;
using MongoDB.Driver;
using Microsoft.Extensions.Logging;
using Microsoft.AspNetCore.SignalR;
using ASTREE_PFE.Hubs;

namespace ASTREE_PFE.Services
{
    public class UserOnlineStatusService : IUserOnlineStatusService, IDisposable
    {
        private readonly IMongoCollection<UserOnlineStatus> _userStatusCollection;
        private readonly ILogger<UserOnlineStatusService> _logger;
        private readonly IHubContext<UserHub> _hubContext;
        private readonly Timer _inactivityTimer;
        
        private static readonly TimeSpan InactivityThreshold = TimeSpan.FromMinutes(2);

        public UserOnlineStatusService(
            IMongoDatabase database, 
            ILogger<UserOnlineStatusService> logger,
            IHubContext<UserHub> hubContext)
        {
            _userStatusCollection = database.GetCollection<UserOnlineStatus>("UserOnlineStatuses");
            _logger = logger;
            _hubContext = hubContext;

            _inactivityTimer = new Timer(CheckInactiveUsers, null, 
                TimeSpan.FromMinutes(1), TimeSpan.FromMinutes(1));

            _logger.LogInformation("UserOnlineStatusService initialized");
        }

        public async Task<IEnumerable<UserOnlineStatus>> GetAllOnlineUsersAsync()
        {
            return await _userStatusCollection.Find(u => u.IsOnline).ToListAsync();
        }

        public async Task<UserOnlineStatus> GetUserStatusAsync(string userId)
        {
            return await _userStatusCollection.Find(u => u.UserId == userId).FirstOrDefaultAsync();
        }

        public async Task<DateTime?> GetLastSeenTimeAsync(string userId)
        {
            var user = await GetUserStatusAsync(userId);
            return user?.LastSeenTime;
        }

        public async Task UserConnectedAsync(string userId)
        {
            await UpdateUserStatusAsync(userId, true);
            _logger.LogInformation("User {UserId} connected and marked online", userId);
        }

        public async Task UserDisconnectedAsync(string userId)
        {
            await UpdateUserStatusAsync(userId, false);
            _logger.LogInformation("User {UserId} disconnected and marked offline", userId);
        }

        public async Task UpdateUserHeartbeatAsync(string userId)
        {
            var filter = Builders<UserOnlineStatus>.Filter.Eq(u => u.UserId, userId);
            var update = Builders<UserOnlineStatus>.Update
                .Set(u => u.LastActivityTime, DateTime.UtcNow)
                .Set(u => u.IsOnline, true);
                
            await _userStatusCollection.UpdateOneAsync(filter, update, new UpdateOptions { IsUpsert = true });
            _logger.LogDebug("Updated heartbeat for user {UserId}", userId);
        }

        public async Task UpdateUserStatusAsync(string userId, bool isOnline)
        {
            var now = DateTime.UtcNow;

            var filter = Builders<UserOnlineStatus>.Filter.Eq(u => u.UserId, userId);
            var update = Builders<UserOnlineStatus>.Update
                .Set(u => u.IsOnline, isOnline)
                .Set(u => u.LastSeenTime, now)
                .Set(u => u.LastActivityTime, now);

            await _userStatusCollection.UpdateOneAsync(filter, update, new UpdateOptions { IsUpsert = true });

            await _hubContext.Clients.All.SendAsync("UserStatusChanged", userId, isOnline, now);
        }

        private async void CheckInactiveUsers(object state)
        {
            try
            {
                _logger.LogDebug("Checking for inactive users");
                var cutoffTime = DateTime.UtcNow.Subtract(InactivityThreshold);

                var filter = Builders<UserOnlineStatus>.Filter.And(
                    Builders<UserOnlineStatus>.Filter.Eq(u => u.IsOnline, true),
                    Builders<UserOnlineStatus>.Filter.Lt(u => u.LastActivityTime, cutoffTime)
                );

                var inactiveUsers = await _userStatusCollection.Find(filter).ToListAsync();
                foreach (var user in inactiveUsers)
                {
                    _logger.LogInformation("Marking inactive user {UserId} as offline", user.UserId);
                    await UpdateUserStatusAsync(user.UserId, false);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error checking inactive users");
            }
        }

        public async Task UpdateUserActivityAsync(string userId)
        {
            var now = DateTime.UtcNow;

            var filter = Builders<UserOnlineStatus>.Filter.Eq(u => u.UserId, userId);
            var update = Builders<UserOnlineStatus>.Update
                .Set(u => u.LastActivityTime, now)
                .Set(u => u.IsOnline, true)
                .Set(u => u.UpdatedAt, now);

            await _userStatusCollection.UpdateOneAsync(filter, update, new UpdateOptions { IsUpsert = true });
            _logger.LogDebug("Updated activity for user {UserId}", userId);
        }

        public async Task RecordConnectionAsync(string userId, string connectionId)
        {
            if (string.IsNullOrEmpty(userId) || string.IsNullOrEmpty(connectionId))
            {
                _logger.LogWarning("Invalid userId or connectionId in RecordConnectionAsync");
                return;
            }

            var filter = Builders<UserOnlineStatus>.Filter.Eq(u => u.UserId, userId);
            var userStatus = await _userStatusCollection.Find(filter).FirstOrDefaultAsync();

            if (userStatus == null)
            {
                userStatus = new UserOnlineStatus
                {
                    UserId = userId,
                    IsOnline = true,
                    LastActivityTime = DateTime.UtcNow,
                    LastSeenTime = DateTime.UtcNow,
                    ConnectionIds = new List<string> { connectionId },
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };
                await _userStatusCollection.InsertOneAsync(userStatus);
                _logger.LogInformation("Created new status for user {UserId} with connection {ConnectionId}", userId, connectionId);
            }
            else
            {
                if (!userStatus.ConnectionIds.Contains(connectionId))
                {
                    var update = Builders<UserOnlineStatus>.Update
                        .Push(u => u.ConnectionIds, connectionId)
                        .Set(u => u.UpdatedAt, DateTime.UtcNow);

                    await _userStatusCollection.UpdateOneAsync(filter, update);
                    _logger.LogDebug("Added connection {ConnectionId} for user {UserId}", connectionId, userId);
                }
            }
        }

        public async Task RecordDisconnectionAsync(string userId, string connectionId)
        {
            if (string.IsNullOrEmpty(userId) || string.IsNullOrEmpty(connectionId))
            {
                _logger.LogWarning("Invalid userId or connectionId in RecordDisconnectionAsync");
                return;
            }

            var filter = Builders<UserOnlineStatus>.Filter.Eq(u => u.UserId, userId);
            var update = Builders<UserOnlineStatus>.Update
                .Pull(u => u.ConnectionIds, connectionId)
                .Set(u => u.UpdatedAt, DateTime.UtcNow);

            await _userStatusCollection.UpdateOneAsync(filter, update);
            _logger.LogDebug("Removed connection {ConnectionId} for user {UserId}", connectionId, userId);

            var userStatus = await _userStatusCollection.Find(filter).FirstOrDefaultAsync();
            if (userStatus != null && (userStatus.ConnectionIds == null || userStatus.ConnectionIds.Count == 0))
            {
                _logger.LogInformation("User {UserId} has no active connections remaining", userId);
            }
        }

        public void Dispose()
        {
            _inactivityTimer?.Dispose();
        }
    }
}
