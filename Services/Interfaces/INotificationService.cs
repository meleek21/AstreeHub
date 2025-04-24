using ASTREE_PFE.Models;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace ASTREE_PFE.Services.Interfaces
{
    public interface INotificationService
    {
        Task<IEnumerable<Notification>> GetAllNotificationsAsync();
        Task<IEnumerable<Notification>> GetUnreadNotificationsAsync(string recipientId);
        Task<IEnumerable<Notification>> GetNotificationsForUserAsync(string userId, int skip = 0, int take = 20);
        Task<int> GetUnreadNotificationCountAsync(string userId);
        Task<Notification> CreateNotificationAsync(Notification notification);
        Task MarkAsReadAsync(string id);
        Task MarkAllAsReadAsync(string recipientId);
        
        // Added method for notification deletion
        Task<bool> DeleteNotificationAsync(string notificationId, string userId);

        // Specific notification type methods
        Task CreateMessageNotificationAsync(string senderId, string receiverId, string conversationId);
        Task CreateReactionNotificationAsync(string reactorId, string postOwnerId, string postId, ReactionType reactionType);
        Task CreateCommentNotificationAsync(string commenterId, string postOwnerId, string postId, string commentContent, string commentId);
        Task CreateEventInvitationNotificationAsync(string organizerId, string inviteeId, string eventId, string eventTitle, DateTime eventDateTime);
        Task CreateEventUpdateNotificationAsync(string eventId, string eventTitle, List<string> attendeeIds, string updateType, string updateDetails);
        Task CreateBirthdayNotificationAsync(string birthdayPersonId, List<string> recipientIds);
        Task CreateEventStatusChangeNotificationAsync(string eventId, string eventTitle, string attendeeId, AttendanceStatus status, string updaterId);
        Task CreateChannelPostNotificationAsync(string posterId, string channelId, string channelName, string postId, string postContent);
    }
}