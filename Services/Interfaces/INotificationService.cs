using ASTREE_PFE.Models;

namespace ASTREE_PFE.Services.Interfaces
{
    public interface INotificationService
    {
        Task<IEnumerable<Notification>> GetAllNotificationsAsync();
        Task<IEnumerable<Notification>> GetUnreadNotificationsAsync(string recipientId);
        Task<IEnumerable<Notification>> GetNotificationsForUserAsync(
            string userId,
            int skip = 0,
            int take = 20
        );
        Task<int> GetUnreadNotificationCountAsync(string userId);
        Task<Notification> CreateNotificationAsync(Notification notification);
        Task MarkAsReadAsync(string id);
        Task MarkAllAsReadAsync(string recipientId);
        Task<bool> DeleteNotificationAsync(string notificationId, string userId);
        Task CreateMessageNotificationAsync(
            string senderId,
            string receiverId,
            string conversationId
        );
        Task CreateReactionNotificationAsync(
            string reactorId,
            string postOwnerId,
            string postId,
            ReactionType reactionType
        );
        Task CreateCommentNotificationAsync(
            string commenterId,
            string postOwnerId,
            string postId,
            string commentContent,
            string commentId
        );
        Task CreateEventInvitationNotificationAsync(
            string organizerId,
            string inviteeId,
            string eventId,
            string eventTitle,
            DateTime eventDateTime
        );
        Task CreateEventUpdateNotificationAsync(
            string eventId,
            string eventTitle,
            List<string> attendeeIds,
            string updateType,
            string updateDetails
        );
        Task CreateBirthdayNotificationAsync(string birthdayPersonId, List<string> recipientIds);
        Task CreateEventStatusChangeNotificationAsync(
            string eventId,
            string eventTitle,
            string organizerId,
            AttendanceStatus status,
            string attendeeName
        );
        Task CreateChannelPostNotificationAsync(
            string posterId,
            string channelId,
            string channelName,
            string postId,
            string postContent
        );

        // New method for todo due tomorrow notification
        Task CreateTodoDueTomorrowNotificationAsync(string todoId, string userId);
    }
}
