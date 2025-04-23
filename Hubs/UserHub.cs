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

        // Method called by client heartbeat
        public async Task UpdateActivity()
        {
            var userId = Context.User?.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            if (!string.IsNullOrEmpty(userId))
            {
                try
                {
                    // Update the last activity timestamp in the service
                    await _userOnlineStatusService.UpdateUserActivityAsync(userId);
                    // No need to broadcast this, it's just a keep-alive
                    // _logger.LogInformation("Activity updated for User ID: {UserId}", userId);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error updating activity for User ID: {UserId}", userId);
                }
            }
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
                    // Record the connection in the service
                    await _userOnlineStatusService.RecordConnectionAsync(userId, connectionId);
                    // Update status and activity (which also marks as online if needed)
                    await _userOnlineStatusService.UpdateUserActivityAsync(userId);
                    // The service will handle broadcasting the online status if it changed
                    // await _userOnlineStatusService.UpdateUserStatusAsync(userId, true); // Let UpdateUserActivityAsync handle this
                    // await Clients.All.SendAsync("UserStatusChanged", userId, true); // Let service broadcast
                    _logger.LogInformation("User {UserId} connected with Connection ID {ConnectionId}. Status updated.", userId, connectionId);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error during OnConnectedAsync for User ID: {UserId}", userId);
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
                // Instead of immediately marking offline, let the service handle it based on activity.
                // The service should have a background task or logic to mark users offline
                // if they haven't sent an UpdateActivity heartbeat recently.
                try
                {
                    // Optionally, notify the service that a specific connection was lost
                    await _userOnlineStatusService.RecordDisconnectionAsync(userId, connectionId);
                    _logger.LogInformation("Recorded disconnection for User ID: {UserId}, Connection ID: {ConnectionId}", userId, connectionId);

                    // DO NOT immediately broadcast offline status here.
                    // Let the IUserOnlineStatusService determine true offline status based on activity.
                    // await _userOnlineStatusService.UpdateUserStatusAsync(userId, false); // REMOVED
                    // await Clients.All.SendAsync("UserStatusChanged", userId, false); // REMOVED
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error recording disconnection for User ID: {UserId}", userId);
                }
            }
            await base.OnDisconnectedAsync(exception);
        }
    }
}