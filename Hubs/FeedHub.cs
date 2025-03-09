using Microsoft.AspNetCore.SignalR;
using ASTREE_PFE.Models;

namespace ASTREE_PFE.Hubs
{
    public class FeedHub : Hub
    {
        // Connection management
        public override async Task OnConnectedAsync()
        {
            await base.OnConnectedAsync();
            // Log connection for debugging
            Console.WriteLine($"Client connected: {Context.ConnectionId}");
        }

        public override async Task OnDisconnectedAsync(Exception exception)
        {
            // Log disconnection for debugging
            Console.WriteLine($"Client disconnected: {Context.ConnectionId}, Exception: {exception?.Message}");
            await base.OnDisconnectedAsync(exception);
        }

        // Method to join a specific feed group (e.g., department-specific feeds)
        public async Task JoinFeedGroup(string groupName)
        {
            await Groups.AddToGroupAsync(Context.ConnectionId, groupName);
        }

        // Method to leave a feed group
        public async Task LeaveFeedGroup(string groupName)
        {
            await Groups.RemoveFromGroupAsync(Context.ConnectionId, groupName);
        }

        // Methods for broadcasting post events
        public async Task BroadcastNewPost(Post post)
        {
            await Clients.All.SendAsync("ReceiveNewPost", post);
        }

        public async Task BroadcastUpdatedPost(Post post)
        {
            await Clients.All.SendAsync("ReceiveUpdatedPost", post);
        }

        public async Task BroadcastDeletedPost(string postId)
        {
            await Clients.All.SendAsync("ReceiveDeletedPost", postId);
        }
        
        // Methods for broadcasting comment events
        public async Task BroadcastNewComment(Comment comment)
        {
            await Clients.All.SendAsync("ReceiveNewComment", comment);
        }
        
        public async Task BroadcastUpdatedComment(Comment comment)
        {
            await Clients.All.SendAsync("ReceiveUpdatedComment", comment);
        }
        
        public async Task BroadcastDeletedComment(string commentId)
        {
            await Clients.All.SendAsync("ReceiveDeletedComment", commentId);
        }
        
        public async Task BroadcastNewReply(Comment reply, string parentCommentId)
        {
            await Clients.All.SendAsync("ReceiveNewReply", reply, parentCommentId);
        }
        
        // Methods for broadcasting reaction events
        public async Task BroadcastNewReaction(Reaction reaction)
        {
            await Clients.All.SendAsync("ReceiveNewReaction", reaction);
        }
        
        public async Task BroadcastUpdatedReaction(Reaction reaction)
        {
            await Clients.All.SendAsync("ReceiveUpdatedReaction", reaction);
        }
        
        public async Task BroadcastDeletedReaction(string reactionId)
        {
            await Clients.All.SendAsync("ReceiveDeletedReaction", reactionId);
        }

        // Method to broadcast to a specific group (e.g., department-specific feeds)
        public async Task BroadcastToGroup(string groupName, string methodName, object data)
        {
            await Clients.Group(groupName).SendAsync(methodName, data);
        }
    }
}