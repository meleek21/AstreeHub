using Microsoft.AspNetCore.SignalR;
using ASTREE_PFE.Services.Interfaces;

namespace ASTREE_PFE.Hubs
{
    public class UserHub : Hub
    {
        private readonly IUserOnlineStatusService _userOnlineStatusService;

        public UserHub(IUserOnlineStatusService userOnlineStatusService)
        {
            _userOnlineStatusService = userOnlineStatusService;
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
            if (!string.IsNullOrEmpty(userId))
            {
                await _userOnlineStatusService.UpdateUserStatusAsync(userId, true);
                await Clients.All.SendAsync("UserStatusChanged", userId, true);
            }
            await base.OnConnectedAsync();
        }

        public override async Task OnDisconnectedAsync(Exception exception)
        {
            var userId = Context.User?.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            if (!string.IsNullOrEmpty(userId))
            {
                await _userOnlineStatusService.UpdateUserStatusAsync(userId, false);
                await Clients.All.SendAsync("UserStatusChanged", userId, false);
            }
            await base.OnDisconnectedAsync(exception);
        }
    }
}