using ASTREE_PFE.Hubs;
using ASTREE_PFE.Models;
using ASTREE_PFE.Repositories.Interfaces;
using ASTREE_PFE.Services.Interfaces;
using Microsoft.AspNetCore.SignalR;

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
            IChannelRepository channelRepository
        )
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

        public async Task<IEnumerable<Notification>> GetNotificationsForUserAsync(
            string userId,
            int skip = 0,
            int take = 20
        )
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
            await _hubContext
                .Clients.User(notification.RecipientId)
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

        // Implemented delete notification method
        public async Task<bool> DeleteNotificationAsync(string notificationId, string userId)
        {
            // First, verify the notification exists and belongs to the user
            var notification = await _notificationRepository.GetByIdAsync(notificationId);

            if (notification == null || notification.RecipientId != userId)
            {
                return false;
            }

            // If notification exists and belongs to the user, delete it
            await _notificationRepository.DeleteAsync(notificationId);
            return true;
        }

        // New methods for specific notification types
        public async Task CreateMessageNotificationAsync(
            string senderId,
            string receiverId,
            string conversationId
        )
        {
            var sender = await _employeeRepository.GetByIdAsync(senderId);

            var notification = new Notification
            {
                Title = "Nouveau Message",
                RecipientId = receiverId,
                Content = $"{sender?.FullName ?? "Quelqu'un"} vous a envoyé un message",
                NotificationType = NotificationType.Message,
                SenderName = sender?.FullName,
                RelatedEntityId = conversationId, // Add conversation ID as related entity
            };

            await CreateNotificationAsync(notification);
        }

        public async Task CreateReactionNotificationAsync(
            string reactorId,
            string postOwnerId,
            string postId,
            ReactionType reactionType
        )
        {
            if (reactorId == postOwnerId)
                return; // Don't notify users about their own reactions

            var reactor = await _employeeRepository.GetByIdAsync(reactorId);

            var reactionText = GetReactionText(reactionType);
            var notification = new Notification
            {
                Title = "Nouvelle Réaction",
                RecipientId = postOwnerId,
                Content = $"{reactor?.FullName ?? "Quelqu'un"} {reactionText} votre publication",
                NotificationType = NotificationType.PostReaction,
                SenderName = reactor?.FullName,
                RelatedEntityId = postId, // Add post ID as related entity
            };

            await CreateNotificationAsync(notification);
        }

        public async Task CreateCommentNotificationAsync(
            string commenterId,
            string postOwnerId,
            string postId,
            string commentContent,
            string commentId
        )
        {
            if (commenterId == postOwnerId)
                return; // Don't notify users about their own comments

            var commenter = await _employeeRepository.GetByIdAsync(commenterId);

            var notification = new Notification
            {
                Title = "Nouveau Commentaire",
                RecipientId = postOwnerId,
                Content =
                    $"{commenter?.FullName ?? "Quelqu'un"} a commenté votre publication: {TruncateContent(commentContent)}",
                NotificationType = NotificationType.Comment,
                SenderName = commenter?.FullName,
                RelatedEntityId = postId, // Add post ID as related entity (could also use commentId depending on navigation needs)
            };

            await CreateNotificationAsync(notification);
        }

        public async Task CreateEventInvitationNotificationAsync(
            string organizerId,
            string inviteeId,
            string eventId,
            string eventTitle,
            DateTime eventDateTime
        )
        {
            var organizer = await _employeeRepository.GetByIdAsync(organizerId);

            var notification = new Notification
            {
                RecipientId = inviteeId,
                Title = "Invitation à un événement",
                Content =
                    $"{organizer?.FullName ?? "Quelqu'un"} vous a invité à {eventTitle} le {eventDateTime:dd MMM yyyy 'à' HH:mm}",
                NotificationType = NotificationType.EventInvitation,
                SenderName = organizer?.FullName,
                RelatedEntityId = eventId, // Add event ID as related entity
            };

            await CreateNotificationAsync(notification);
        }

        public async Task CreateEventUpdateNotificationAsync(
            string eventId,
            string eventTitle,
            List<string> attendeeIds,
            string updateType,
            string updateDetails
        )
        {
            foreach (var attendeeId in attendeeIds)
            {
                var notification = new Notification
                {
                    RecipientId = attendeeId,
                    Title = "Mise à jour d'événement",
                    Content =
                        $"L'événement '{eventTitle}' a été mis à jour: {updateType} - {updateDetails}",
                    NotificationType = NotificationType.EventUpdate,
                    RelatedEntityId = eventId, // Add event ID as related entity
                };

                await CreateNotificationAsync(notification);
            }
        }

        public async Task CreateBirthdayNotificationAsync(
            string birthdayPersonId,
            List<string> recipientIds
        )
        {
            var birthdayPerson = await _employeeRepository.GetByIdAsync(birthdayPersonId);
            if (birthdayPerson == null)
                return;

            // Check if today is the person's birthday
            var today = DateTime.Today;
            var isBirthdayToday =
                birthdayPerson.DateOfBirth.Month == today.Month
                && birthdayPerson.DateOfBirth.Day == today.Day;

            // Only proceed if today is the person's birthday
            if (!isBirthdayToday)
                return;

            foreach (var recipientId in recipientIds)
            {
                // Skip sending notification to the birthday person themselves
                if (recipientId == birthdayPersonId)
                    continue;

                var notification = new Notification
                {
                    RecipientId = recipientId,
                    Title = "Célébration d'anniversaire",
                    Content = $"Aujourd'hui, c'est l'anniversaire de {birthdayPerson.FullName}! 🎂",
                    NotificationType = NotificationType.Birthday,
                    SenderName = birthdayPerson.FullName,
                    RelatedEntityId = birthdayPersonId, // Add birthday person ID as related entity
                };

                await CreateNotificationAsync(notification);
            }
        }

        public async Task CreateEventStatusChangeNotificationAsync(
            string eventId,
            string eventTitle,
            string organizerId, // Renamed to clearly indicate this is the organizer who will receive the notification
            AttendanceStatus status,
            string attendeeName // Changed to attendeeName to better reflect what's being passed
        )
        {
            // No need to look up the organizer - they're the recipient
            var statusText = GetAttendanceStatusText(status);

            var notification = new Notification
            {
                RecipientId = organizerId,
                Title = "Mise à jour du statut de l'événement",
                Content =
                    $"{attendeeName} a {(status == AttendanceStatus.Accepté ? "accepté" : "refusé")} votre invitation à l'événement '{eventTitle}'",
                NotificationType = NotificationType.EventStatusChange,
                RelatedEntityId = eventId, // Add event ID as related entity
            };

            await CreateNotificationAsync(notification);
        }

        public async Task CreateChannelPostNotificationAsync(
            string posterId,
            string channelId,
            string channelName,
            string postId,
            string postContent
        )
        {
            // Skip notification if the poster is the same as recipient (though this shouldn't happen for broadcasts)
            var poster = await _employeeRepository.GetByIdAsync(posterId);

            // For specific department channels, notify only department members
            var channel = await _channelRepository.GetByIdAsync(channelId);
            List<string> recipientIds;

            if (channel != null && channel.DepartmentId.HasValue)
            {
                // Get all employees in this department
                var departmentEmployees = await _employeeRepository.GetByDepartmentAsync(
                    channel.DepartmentId.Value
                );
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
                    Title = $"Nouvelle publication dans {channelName}",
                    Content =
                        $"{poster?.FullName ?? "Quelqu'un"} a publié dans {channelName}: {TruncateContent(postContent)}",
                    NotificationType = NotificationType.ChannelPost,
                    SenderName = poster?.FullName,
                    RelatedEntityId = postId, // Add post ID as related entity
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
                ReactionType.Jaime => "a aimé",
                ReactionType.Jadore => "a adoré",
                ReactionType.Bravo => "a applaudi",
                ReactionType.Youpi => "a célébré",
                ReactionType.Brillant => "a trouvé brillant",
                _ => "a réagi à",
            };
        }

        private string GetAttendanceStatusText(AttendanceStatus status)
        {
            return status switch
            {
                AttendanceStatus.Accepté => "Accepté",
                AttendanceStatus.Refusé => "Refusé",
                AttendanceStatus.EnAttente => "En attente",
                _ => "Mis à jour",
            };
        }
    }
}
