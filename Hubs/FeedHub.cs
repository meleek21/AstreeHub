using Microsoft.AspNetCore.SignalR;
using ASTREE_PFE.Models;
using ASTREE_PFE.Repositories.Interfaces; // Added for IEmployeeRepository
using System; // Added for Exception
using System.Threading.Tasks; // Added for Task

namespace ASTREE_PFE.Hubs
{
    public class FeedHub : Hub
    {
        private readonly IEmployeeRepository _employeeRepository; // Added dependency

        // Inject IEmployeeRepository
        public FeedHub(IEmployeeRepository employeeRepository)
        {
            _employeeRepository = employeeRepository;
        }

        // Connection management
        public override async Task OnConnectedAsync()
        {
            var userId = Context.UserIdentifier; // Assuming UserIdentifier holds the Employee ID
            if (!string.IsNullOrEmpty(userId))
            {
                var employee = await _employeeRepository.GetByIdAsync(userId);
                if (employee != null && employee.DepartmentId.HasValue)
                {
                    string departmentIdString = employee.DepartmentId.Value.ToString();
                    await Groups.AddToGroupAsync(Context.ConnectionId, departmentIdString);
                    Console.WriteLine($"Client {Context.ConnectionId} (User: {userId}) added to group {departmentIdString}");
                }
                else
                {
                    Console.WriteLine($"Client {Context.ConnectionId} (User: {userId}) connected but has no department or employee record not found.");
                }
            }
            else
            {
                 Console.WriteLine($"Client {Context.ConnectionId} connected without a UserIdentifier.");
            }

            await base.OnConnectedAsync();
            // Log connection for debugging
            Console.WriteLine($"Client connected: {Context.ConnectionId}");
        }

        public override async Task OnDisconnectedAsync(Exception exception)
        {
             var userId = Context.UserIdentifier; // Assuming UserIdentifier holds the Employee ID
            if (!string.IsNullOrEmpty(userId))
            {
                var employee = await _employeeRepository.GetByIdAsync(userId);
                if (employee != null && employee.DepartmentId.HasValue)
                {
                    string departmentIdString = employee.DepartmentId.Value.ToString();
                    await Groups.RemoveFromGroupAsync(Context.ConnectionId, departmentIdString);
                    Console.WriteLine($"Client {Context.ConnectionId} (User: {userId}) removed from group {departmentIdString}");
                }
                 else
                {
                    Console.WriteLine($"Client {Context.ConnectionId} (User: {userId}) disconnected but had no department or employee record not found for group removal.");
                }
            }
            else
            {
                 Console.WriteLine($"Client {Context.ConnectionId} disconnected without a UserIdentifier.");
            }

            // Log disconnection for debugging
            Console.WriteLine($"Client disconnected: {Context.ConnectionId}, Exception: {exception?.Message}");
            await base.OnDisconnectedAsync(exception);
        }

        // Method to join a specific feed group (e.g., department-specific feeds) - Can be kept for manual joining if needed
        public async Task JoinFeedGroup(string groupName)
        {
            await Groups.AddToGroupAsync(Context.ConnectionId, groupName);
        }

        // Method to leave a feed group - Can be kept for manual leaving if needed
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

        // Methods for broadcasting file events
        public async Task BroadcastNewFile(ASTREE_PFE.Models.File file)
        {
            await Clients.All.SendAsync("ReceiveNewFile", file);
        }
        
        public async Task BroadcastUpdatedFile(ASTREE_PFE.Models.File file)
        {
            await Clients.All.SendAsync("ReceiveUpdatedFile", file);
        }
        
        public async Task BroadcastDeletedFile(string fileId)
        {
            await Clients.All.SendAsync("ReceiveDeletedFile", fileId);
        }
    }
}