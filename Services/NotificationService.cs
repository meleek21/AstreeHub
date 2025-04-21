using ASTREE_PFE.Models;
using ASTREE_PFE.Repositories;
using ASTREE_PFE.Hubs;
using ASTREE_PFE.Services.Interfaces;
using Microsoft.AspNetCore.SignalR;
using System.Collections.Generic;
using System.Threading.Tasks;
using ASTREE_PFE.Repositories.Interfaces;


namespace ASTREE_PFE.Services
{
    public class NotificationService : INotificationService
    {
        private readonly INotificationRepository _notificationRepository;
        private readonly IHubContext<NotificationHub> _hubContext;
        private readonly IEmployeeRepository _employeeRepository;
        private readonly IChannelRepository _channelRepository;

        public NotificationService(
            INotificationRepository notificationRepository,
            IHubContext<NotificationHub> hubContext,
            IEmployeeRepository employeeRepository,
            IChannelRepository channelRepository)
        {
            _notificationRepository = notificationRepository;
            _hubContext = hubContext;
            _employeeRepository = employeeRepository;
            _channelRepository = channelRepository;
        }

        public async Task<IEnumerable<Notification>> GetAllNotificationsAsync()
        {
            return await _notificationRepository.GetAllAsync();
        }

        public async Task<IEnumerable<Notification>> GetUnreadNotificationsAsync(string recipientId)
        {
            return await _notificationRepository.GetUnreadNotificationsAsync(recipientId);
        }

        public async Task<IEnumerable<Notification>> GetNotificationsForUserAsync(string userId, int skip = 0, int take = 20)
        {
            return await _notificationRepository.GetNotificationsForUserAsync(userId, skip, take);
        }

        public async Task<int> GetUnreadNotificationCountAsync(string userId)
        {
            return await _notificationRepository.GetUnreadCountAsync(userId);
        }

        public async Task<Notification> CreateNotificationAsync(Notification notification)
        {
            await _notificationRepository.CreateAsync(notification);
            await _hubContext.Clients.User(notification.RecipientId)
                .SendAsync("ReceiveNotification", notification);
            return notification;
        }

        public async Task MarkAsReadAsync(string id)
        {
            await _notificationRepository.MarkAsReadAsync(id);
        }

        public async Task MarkAllAsReadAsync(string recipientId)
        {
            await _notificationRepository.MarkAllAsReadAsync(recipientId);
        }

        // New methods for specific notification types
        public async Task CreateMessageNotificationAsync(string senderId, string receiverId,  string conversationId)
        {
            var sender = await _employeeRepository.GetByIdAsync(senderId);

            var notification = new Notification
            {
                RecipientId = receiverId,
                Content = $"{sender?.FullName ?? "Someone"} sent you a message",
                NotificationType = NotificationType.Message,
                RelatedEntityId = conversationId,
                SenderName = sender?.FullName,
                SenderProfilePicture = sender?.ProfilePictureUrl,
                ActionUrl = $"/conversations/{conversationId}"
            };

            await CreateNotificationAsync(notification);
        }

        public async Task CreateReactionNotificationAsync(string reactorId, string postOwnerId, string postId, ReactionType reactionType)
        {
            if (reactorId == postOwnerId)
                return; // Don't notify users about their own reactions
                
            var reactor = await _employeeRepository.GetByIdAsync(reactorId);

            var reactionText = GetReactionText(reactionType);
            var notification = new Notification
            {
                RecipientId = postOwnerId,
                Content = $"{reactor?.FullName ?? "Someone"} {reactionText} your post",
                NotificationType = NotificationType.PostReaction,
                RelatedEntityId = postId,
                SenderName = reactor?.FullName,
                SenderProfilePicture = reactor?.ProfilePictureUrl,
                ActionUrl = $"/posts/{postId}"
            };

            await CreateNotificationAsync(notification);
        }

        public async Task CreateCommentNotificationAsync(string commenterId, string postOwnerId, string postId, string commentContent, string commentId)
        {
            if (commenterId == postOwnerId)
                return; // Don't notify users about their own comments
                
            var commenter = await _employeeRepository.GetByIdAsync(commenterId);

            var notification = new Notification
            {
                RecipientId = postOwnerId,
                Content = $"{commenter?.FullName ?? "Someone"} commented on your post: {TruncateContent(commentContent)}",
                NotificationType = NotificationType.Comment,
                RelatedEntityId = postId,
                SenderName = commenter?.FullName,
                SenderProfilePicture = commenter?.ProfilePictureUrl,
                ActionUrl = $"/posts/{postId}?commentId={commentId}"
            };

            await CreateNotificationAsync(notification);
        }

        public async Task CreateEventInvitationNotificationAsync(string organizerId, string inviteeId, string eventId, string eventTitle, DateTime eventDateTime)
        {
            var organizer = await _employeeRepository.GetByIdAsync(organizerId);

            var notification = new Notification
            {
                RecipientId = inviteeId,
                Title = "Event Invitation",
                Content = $"{organizer?.FullName ?? "Someone"} invited you to {eventTitle} on {eventDateTime:MMM dd, yyyy 'at' h:mm tt}",
                NotificationType = NotificationType.EventInvitation,
                RelatedEntityId = eventId,
                SenderName = organizer?.FullName,
                SenderProfilePicture = organizer?.ProfilePictureUrl,
                ActionUrl = $"/events/{eventId}"
            };

            await CreateNotificationAsync(notification);
        }

        public async Task CreateEventUpdateNotificationAsync(string eventId, string eventTitle, List<string> attendeeIds, string updateType, string updateDetails)
        {
            foreach (var attendeeId in attendeeIds)
            {
                var notification = new Notification
                {
                    RecipientId = attendeeId,
                    Title = "Event Update",
                    Content = $"The event '{eventTitle}' has been updated: {updateType} - {updateDetails}",
                    NotificationType = NotificationType.EventUpdate,
                    RelatedEntityId = eventId,
                    ActionUrl = $"/events/{eventId}"
                };

                await CreateNotificationAsync(notification);
            }
        }

        public async Task CreateBirthdayNotificationAsync(string birthdayPersonId, List<string> recipientIds)
        {
            var birthdayPerson = await _employeeRepository.GetByIdAsync(birthdayPersonId);
            if (birthdayPerson == null) return;

            foreach (var recipientId in recipientIds)
            {
                // Skip sending notification to the birthday person themselves
                if (recipientId == birthdayPersonId)
                    continue;

                var notification = new Notification
                {
                    RecipientId = recipientId,
                    Title = "Birthday Celebration",
                    Content = $"Today is {birthdayPerson.FullName}'s birthday! 🎂",
                    NotificationType = NotificationType.Birthday,
                    RelatedEntityId = birthdayPersonId,
                    SenderName = birthdayPerson.FullName,
                    SenderProfilePicture = birthdayPerson.ProfilePictureUrl,
                    ActionUrl = $"/employees/{birthdayPersonId}"
                };

                await CreateNotificationAsync(notification);
            }
        }


        public async Task CreateEventStatusChangeNotificationAsync(string eventId, string eventTitle, string attendeeId, AttendanceStatus status, string updaterId)
        {
            var updater = await _employeeRepository.GetByIdAsync(updaterId);
            string statusText = GetAttendanceStatusText(status);

            var notification = new Notification
            {
                RecipientId = attendeeId,
                Title = "Event Status Update",
                Content = $"Your attendance status for '{eventTitle}' has been marked as {statusText}",
                NotificationType = NotificationType.EventStatusChange,
                RelatedEntityId = eventId,
                SenderName = updater?.FullName,
                SenderProfilePicture = updater?.ProfilePictureUrl,
                ActionUrl = $"/events/{eventId}"
            };

            await CreateNotificationAsync(notification);
        }
        public async Task CreateChannelPostNotificationAsync(string posterId, string channelId, string channelName, string postId, string postContent)
{
    // Skip notification if the poster is the same as recipient (though this shouldn't happen for broadcasts)
    var poster = await _employeeRepository.GetByIdAsync(posterId);
    
    // For specific department channels, notify only department members
    var channel = await _channelRepository.GetByIdAsync(channelId);
    List<string> recipientIds;
    
    if (channel != null && channel.DepartmentId.HasValue)
    {
        // Get all employees in this department
        var departmentEmployees = await _employeeRepository.GetByDepartmentAsync(channel.DepartmentId.Value);
        recipientIds = departmentEmployees
            .Where(e => e.Id != posterId) // Don't notify the poster
            .Select(e => e.Id)
            .ToList();
    }
    else
    {
        // For general channels, notify all employees
        var allEmployees = await _employeeRepository.GetAllAsync();
        recipientIds = allEmployees
            .Where(e => e.Id != posterId) // Don't notify the poster
            .Select(e => e.Id)
            .ToList();
    }

    // Create a notification for each recipient
    foreach (var recipientId in recipientIds)
    {
        var notification = new Notification
        {
            RecipientId = recipientId,
            Title = $"New post in {channelName}",
            Content = $"{poster?.FullName ?? "Someone"} posted in {channelName}: {TruncateContent(postContent)}",
            NotificationType = NotificationType.ChannelPost,
            RelatedEntityId = postId,
            SenderName = poster?.FullName,
            SenderProfilePicture = poster?.ProfilePictureUrl,
            ActionUrl = $"/channels/{channelId}/posts/{postId}"
        };

        await CreateNotificationAsync(notification);
    }
}


        // Helper methods
        private string TruncateContent(string content, int maxLength = 50)
        {
            if (string.IsNullOrEmpty(content))
                return string.Empty;

            return content.Length <= maxLength ? content : content.Substring(0, maxLength) + "...";
        }

        private string GetReactionText(ReactionType reactionType)
        {
            return reactionType switch
            {
                ReactionType.Jaime => "liked",
                ReactionType.Jadore => "loved",
                ReactionType.Bravo => "applauded",
                ReactionType.Youpi => "celebrated",
                ReactionType.Brillant => "found brilliant",
                _ => "reacted to"
            };
        }

        private string GetAttendanceStatusText(AttendanceStatus status)
        {
            return status switch
            {
                AttendanceStatus.Accepted => "Accepted",
                AttendanceStatus.Declined => "Declined",
                AttendanceStatus.Pending => "Pending",
                _ => "Updated"
            };
        }
    }
}