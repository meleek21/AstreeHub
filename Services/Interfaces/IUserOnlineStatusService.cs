using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using ASTREE_PFE.Models;

namespace ASTREE_PFE.Services.Interfaces
{
    public interface IUserOnlineStatusService
    {
        Task<UserOnlineStatus> GetUserStatusAsync(string userId);
        Task<IEnumerable<UserOnlineStatus>> GetAllOnlineUsersAsync();
        Task UpdateUserStatusAsync(string userId, bool isOnline);
        Task UpdateLastActivityAsync(string userId); // Keep for potential direct calls
        Task UpdateUserActivityAsync(string userId); // Called by Hub heartbeat
        Task RecordDisconnectionAsync(string userId, string connectionId); // Called by Hub OnDisconnectedAsync
        Task<DateTime?> GetLastSeenTimeAsync(string userId);
        Task RecordConnectionAsync(string userId, string connectionId); // Called by Hub OnConnectedAsync
    }
}