using Microsoft.AspNetCore.SignalR;
using ASTREE_PFE.Services.Interfaces;
using Microsoft.Extensions.Logging; // Add this using statement
using System;
using System.Threading.Tasks;

namespace ASTREE_PFE.Hubs
{
    public class UserHub : Hub
    {
        private readonly IUserOnlineStatusService _userOnlineStatusService;
        private readonly ILogger<UserHub> _logger; // Add logger field

        // Inject ILogger in the constructor
        public UserHub(IUserOnlineStatusService userOnlineStatusService, ILogger<UserHub> logger)
        {
            _userOnlineStatusService = userOnlineStatusService;
            _logger = logger; // Assign logger
        }
        public async Task UpdateUserStatus(string userId, bool isOnline)
        {
            await _userOnlineStatusService.UpdateUserStatusAsync(userId, isOnline);
            await Clients.All.SendAsync("UserStatusChanged", userId, isOnline);
        }

        public async Task JoinUserGroup(string userId)
        {
            await Groups.AddToGroupAsync(Context.ConnectionId, $"user_{userId}");
        }

        public async Task LeaveUserGroup(string userId)
        {
            await Groups.RemoveFromGroupAsync(Context.ConnectionId, $"user_{userId}");
        }

        public async Task NotifyUserActivity(string userId, string activity)
        {
            await Clients.Group($"user_{userId}").SendAsync("UserActivity", userId, activity);
        }

        public override async Task OnConnectedAsync()
        {
            var userId = Context.User?.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            var connectionId = Context.ConnectionId;
            _logger.LogInformation("User connected. User ID: {UserId}, Connection ID: {ConnectionId}", userId ?? "Anonymous", connectionId);

            if (!string.IsNullOrEmpty(userId))
            {
                try
                {
                    await _userOnlineStatusService.UpdateUserStatusAsync(userId, true);
                    await Clients.All.SendAsync("UserStatusChanged", userId, true);
                    _logger.LogInformation("Updated status to online for User ID: {UserId}", userId);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error updating user status to online for User ID: {UserId}", userId);
                }
            }
            await base.OnConnectedAsync();
        }

        public override async Task OnDisconnectedAsync(Exception exception)
        {
            var userId = Context.User?.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            var connectionId = Context.ConnectionId;

            if (exception != null)
            {
                _logger.LogError(exception, "User disconnected with error. User ID: {UserId}, Connection ID: {ConnectionId}", userId ?? "Anonymous", connectionId);
            }
            else
            {
                _logger.LogInformation("User disconnected gracefully. User ID: {UserId}, Connection ID: {ConnectionId}", userId ?? "Anonymous", connectionId);
            }

            if (!string.IsNullOrEmpty(userId))
            {
                try
                {
                    await _userOnlineStatusService.UpdateUserStatusAsync(userId, false);
                    await Clients.All.SendAsync("UserStatusChanged", userId, false);
                    _logger.LogInformation("Updated status to offline for User ID: {UserId}", userId);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error updating user status to offline for User ID: {UserId}", userId);
                }
            }
            await base.OnDisconnectedAsync(exception);
        }
    }
}