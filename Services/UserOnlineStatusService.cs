using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using ASTREE_PFE.Models;
using ASTREE_PFE.Services.Interfaces;
using MongoDB.Driver;
using Microsoft.Extensions.Logging;
using Microsoft.AspNetCore.SignalR; // Required for IHubContext
using ASTREE_PFE.Hubs; // Required for UserHub
using System.Collections.Concurrent; // For tracking connections

namespace ASTREE_PFE.Services
{
    public class UserOnlineStatusService : IUserOnlineStatusService, IDisposable // Implement IDisposable if using timers
    {
        private readonly IMongoCollection<UserOnlineStatus> _userOnlineStatusCollection;
        private readonly ILogger<UserOnlineStatusService> _logger;
        private readonly IHubContext<UserHub> _hubContext; // Inject HubContext to broadcast changes
        private readonly ConcurrentDictionary<string, ConcurrentDictionary<string, DateTime>> _userConnections = new(); // userId -> { connectionId -> connectionTime }
        private readonly Timer _inactivityCheckTimer; // Timer for checking inactivity
        private static readonly TimeSpan InactivityThreshold = TimeSpan.FromMinutes(1.5); // e.g., 1.5 minutes - slightly longer than client timeout
        private static readonly TimeSpan InactivityCheckInterval = TimeSpan.FromSeconds(30); // Check every 30 seconds

        public UserOnlineStatusService(IMongoDatabase database, ILogger<UserOnlineStatusService> logger, IHubContext<UserHub> hubContext)
        {
            _userOnlineStatusCollection = database.GetCollection<UserOnlineStatus>("UserOnlineStatuses");
            _logger = logger;
            _hubContext = hubContext;

            // Start the timer to periodically check for inactive users
            _inactivityCheckTimer = new Timer(CheckForInactiveUsers, null, InactivityCheckInterval, InactivityCheckInterval);
            _logger.LogInformation("UserOnlineStatusService initialized and inactivity timer started.");
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

        // Called by UserHub on heartbeat
        public async Task UpdateUserActivityAsync(string userId)
        {
            var filter = Builders<UserOnlineStatus>.Filter.Eq(u => u.UserId, userId);
            var update = Builders<UserOnlineStatus>.Update
                .Set(u => u.LastActivityTime, DateTime.UtcNow)
                .SetOnInsert(u => u.IsOnline, true) // Mark as online if this is the first activity update
                .SetOnInsert(u => u.LastSeenTime, DateTime.UtcNow); // Also set LastSeenTime on insert

            var result = await _userOnlineStatusCollection.UpdateOneAsync(filter, update, new UpdateOptions { IsUpsert = true });

            // If this upsert resulted in the user being marked online (or was already online)
            // Ensure the connection is tracked (though OnConnectedAsync should handle initial add)
            // This handles cases where the service might restart but client reconnects and sends heartbeat
            if (result.IsAcknowledged && (result.MatchedCount > 0 || result.UpsertedId != null))
            {
                // Check if the user wasn't considered online before this activity
                var userStatus = await GetUserStatusAsync(userId);
                if (userStatus != null && !userStatus.IsOnline)
                {
                    _logger.LogInformation("User {UserId} marked as online due to activity.", userId);
                    await UpdateUserStatusInternalAsync(userId, true); // Use internal method to also broadcast
                }
            }
        }

        // Called by UserHub OnDisconnectedAsync
        public Task RecordDisconnectionAsync(string userId, string connectionId)
        {
            if (_userConnections.TryGetValue(userId, out var connections))
            {
                if (connections.TryRemove(connectionId, out _))
                {
                    _logger.LogInformation("Removed connection {ConnectionId} for user {UserId}. Remaining: {Count}", connectionId, userId, connections.Count);
                    if (connections.IsEmpty)
                    {
                        // If this was the last connection, start the process to check for inactivity soon,
                        // but don't mark offline immediately. The timer will handle it.
                        _logger.LogInformation("Last connection removed for user {UserId}. Inactivity timer will verify status.", userId);
                        // Optionally trigger an immediate check, but the periodic timer is generally sufficient
                        // CheckForInactiveUsers(null); 
                    }
                }
            }
            return Task.CompletedTask;
        }

        // Internal method to update status and broadcast
        private async Task UpdateUserStatusInternalAsync(string userId, bool isOnline)
        {
            var lastSeenTime = DateTime.UtcNow;
            var filter = Builders<UserOnlineStatus>.Filter.Eq(u => u.UserId, userId);
            var update = Builders<UserOnlineStatus>.Update
                .Set(u => u.IsOnline, isOnline)
                .Set(u => u.LastSeenTime, lastSeenTime); // Always update LastSeenTime on status change

            // If marking offline, also clear connections (though RecordDisconnectionAsync should handle most)
            if (!isOnline)
            {
                _userConnections.TryRemove(userId, out _);
                _logger.LogInformation("Clearing tracked connections for user {UserId} due to being marked offline.", userId);
            }

            await _userOnlineStatusCollection.UpdateOneAsync(filter, update, new UpdateOptions { IsUpsert = true });
            _logger.LogInformation("Broadcasting UserStatusChanged for {UserId}: IsOnline={IsOnline}", userId, isOnline);
            await _hubContext.Clients.All.SendAsync("UserStatusChanged", userId, isOnline, lastSeenTime);
        }

        // Timer callback method
        private async void CheckForInactiveUsers(object? state)
        {
            _logger.LogDebug("Running inactivity check...");
            var cutoffTime = DateTime.UtcNow.Subtract(InactivityThreshold);
            var potentiallyInactiveUsersFilter = Builders<UserOnlineStatus>.Filter.And(
                Builders<UserOnlineStatus>.Filter.Eq(u => u.IsOnline, true),
                Builders<UserOnlineStatus>.Filter.Lt(u => u.LastActivityTime, cutoffTime)
            );

            var inactiveUsers = await _userOnlineStatusCollection.Find(potentiallyInactiveUsersFilter).ToListAsync();

            foreach (var user in inactiveUsers)
            {
                // Double-check if any connections still exist (e.g., race condition)
                if (!_userConnections.TryGetValue(user.UserId, out var connections) || connections.IsEmpty)
                {
                    _logger.LogInformation("User {UserId} found inactive (Last Activity: {LastActivityTime}). Marking offline.", user.UserId, user.LastActivityTime);
                    await UpdateUserStatusInternalAsync(user.UserId, false);
                }
                else
                {
                    // This case should be rare if OnDisconnected cleans up properly
                    _logger.LogWarning("User {UserId} flagged as inactive but still has {Count} tracked connections. Skipping offline status update for now.", user.UserId, connections.Count);
                }
            }
            _logger.LogDebug("Inactivity check finished.");
        }

        // Called by UserHub OnConnectedAsync (needs modification in UserHub too)
        public Task RecordConnectionAsync(string userId, string connectionId)
        {
             var userConnectionDict = _userConnections.GetOrAdd(userId, _ => new ConcurrentDictionary<string, DateTime>());
             userConnectionDict.TryAdd(connectionId, DateTime.UtcNow);
             _logger.LogInformation("Added connection {ConnectionId} for user {UserId}. Total: {Count}", connectionId, userId, userConnectionDict.Count);
             return Task.CompletedTask;
        }

        // Implement IDisposable
        public void Dispose()
        {
            _inactivityCheckTimer?.Dispose();
            GC.SuppressFinalize(this);
        }

        // This method might still be useful for direct updates if needed, but heartbeat uses UpdateUserActivityAsync
        public async Task UpdateLastActivityAsync(string userId)
        {
            var filter = Builders<UserOnlineStatus>.Filter.Eq(u => u.UserId, userId);
            var update = Builders<UserOnlineStatus>.Update
                .Set(u => u.LastActivityTime, DateTime.UtcNow);

            await _userOnlineStatusCollection.UpdateOneAsync(filter, update, new UpdateOptions { IsUpsert = true });
        }
    }
}