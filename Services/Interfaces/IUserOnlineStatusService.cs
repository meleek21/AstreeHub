
using ASTREE_PFE.Models;

namespace ASTREE_PFE.Services.Interfaces
{
    public interface IUserOnlineStatusService
    {
        // Existing methods
        Task<IEnumerable<UserOnlineStatus>> GetAllOnlineUsersAsync();
        Task<UserOnlineStatus> GetUserStatusAsync(string userId);
        Task<DateTime?> GetLastSeenTimeAsync(string userId);
        Task UpdateUserStatusAsync(string userId, bool isOnline);
        Task UpdateUserHeartbeatAsync(string userId);
        Task UserConnectedAsync(string userId);
        Task UserDisconnectedAsync(string userId);

        // Add the missing methods
        Task UpdateUserActivityAsync(string userId);
        Task RecordConnectionAsync(string userId, string connectionId);
        Task RecordDisconnectionAsync(string userId, string connectionId);
    }
}
