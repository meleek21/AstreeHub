using Microsoft.AspNetCore.SignalR;

namespace ASTREE_PFE.Hubs
{
    public class UserHub : Hub
    {
        public async Task UpdateUserStatus(string userId, bool isOnline)
        {
            await Clients.All.SendAsync("UserStatusChanged", userId, isOnline);
        }

        public async Task UpdateUserProfile(string userId, string updatedField, string newValue)
        {
            await Clients.All.SendAsync("UserProfileUpdated", userId, updatedField, newValue);
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

        public async Task NotifyProfileUpdate(string userId)
        {
            await Clients.All.SendAsync("ReceiveProfileUpdate", userId);
        }

        public override async Task OnConnectedAsync()
        {
            await Clients.All.SendAsync("UserConnected", Context.ConnectionId);
            await base.OnConnectedAsync();
        }

        public override async Task OnDisconnectedAsync(Exception exception)
        {
            await Clients.All.SendAsync("UserDisconnected", Context.ConnectionId);
            await base.OnDisconnectedAsync(exception);
        }
    }
}