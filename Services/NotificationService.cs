using ASTREE_PFE.Models;
using ASTREE_PFE.Repositories;
using ASTREE_PFE.Hubs;
using Microsoft.AspNetCore.SignalR;

namespace ASTREE_PFE.Services
{
    public interface INotificationService
    {
        Task<IEnumerable<Notification>> GetAllNotificationsAsync();
        Task<IEnumerable<Notification>> GetUnreadNotificationsAsync(string recipientId);
        Task<Notification> CreateNotificationAsync(Notification notification);
        Task MarkAsReadAsync(string id);
        Task MarkAllAsReadAsync(string recipientId);
    }

    public class NotificationService : INotificationService
    {
        private readonly INotificationRepository _notificationRepository;
        private readonly IHubContext<NotificationHub> _hubContext;

        public NotificationService(
            INotificationRepository notificationRepository,
            IHubContext<NotificationHub> hubContext)
        {
            _notificationRepository = notificationRepository;
            _hubContext = hubContext;
        }

        public async Task<IEnumerable<Notification>> GetAllNotificationsAsync()
        {
            return await _notificationRepository.GetAllAsync();
        }

        public async Task<IEnumerable<Notification>> GetUnreadNotificationsAsync(string recipientId)
        {
            return await _notificationRepository.GetUnreadNotificationsAsync(recipientId);
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
    }
}