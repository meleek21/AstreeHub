
using ASTREE_PFE.Services.Interfaces;
using Microsoft.AspNetCore.SignalR;


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
            var userId = Context
                .User?.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)
                ?.Value;
            if (!string.IsNullOrEmpty(userId))
            {
                try
                {
                    // Update the last activity timestamp in the service
                    await _userOnlineStatusService.UpdateUserActivityAsync(userId);
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
            var userId = Context
                .User?.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)
                ?.Value;
            var connectionId = Context.ConnectionId;
            _logger.LogInformation(
                "User connected. User ID: {UserId}, Connection ID: {ConnectionId}",
                userId ?? "Anonymous",
                connectionId
            );

            if (!string.IsNullOrEmpty(userId))
            {
                try
                {
                    // Record the connection in the service
                    await _userOnlineStatusService.RecordConnectionAsync(userId, connectionId);
                    // Update status and activity (which also marks as online if needed)
                    await _userOnlineStatusService.UpdateUserActivityAsync(userId);
                    _logger.LogInformation(
                        "User {UserId} connected with Connection ID {ConnectionId}. Status updated.",
                        userId,
                        connectionId
                    );
                }
                catch (Exception ex)
                {
                    _logger.LogError(
                        ex,
                        "Error during OnConnectedAsync for User ID: {UserId}",
                        userId
                    );
                }
            }
            await base.OnConnectedAsync();
        }

        public override async Task OnDisconnectedAsync(Exception exception)
        {
            var userId = Context
                .User?.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)
                ?.Value;
            var connectionId = Context.ConnectionId;

            if (exception != null)
            {
                _logger.LogError(
                    exception,
                    "User disconnected with error. User ID: {UserId}, Connection ID: {ConnectionId}",
                    userId ?? "Anonymous",
                    connectionId
                );
            }
            else
            {
                _logger.LogInformation(
                    "User disconnected gracefully. User ID: {UserId}, Connection ID: {ConnectionId}",
                    userId ?? "Anonymous",
                    connectionId
                );
            }

            if (!string.IsNullOrEmpty(userId))
            {
                try
                {
                    await _userOnlineStatusService.RecordDisconnectionAsync(userId, connectionId);
                    _logger.LogInformation(
                        "Recorded disconnection for User ID: {UserId}, Connection ID: {ConnectionId}",
                        userId,
                        connectionId
                    );
                }
                catch (Exception ex)
                {
                    _logger.LogError(
                        ex,
                        "Error recording disconnection for User ID: {UserId}",
                        userId
                    );
                }
            }
            await base.OnDisconnectedAsync(exception);
        }
    }
}
