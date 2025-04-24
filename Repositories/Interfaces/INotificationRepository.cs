using ASTREE_PFE.Models;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace ASTREE_PFE.Repositories.Interfaces
{
    public interface INotificationRepository
    {
        Task<IEnumerable<Notification>> GetAllAsync();
        Task<IEnumerable<Notification>> GetUnreadNotificationsAsync(string recipientId);
        Task<IEnumerable<Notification>> GetNotificationsForUserAsync(string userId, int skip = 0, int take = 20);
        Task<int> GetUnreadCountAsync(string userId);
        // Add this to INotificationRepository
        Task<Notification> GetByIdAsync(string id);
        Task CreateAsync(Notification notification);
        Task MarkAsReadAsync(string id);
        Task MarkAllAsReadAsync(string recipientId);
        Task DeleteAsync(string id);
        Task DeleteAllForUserAsync(string userId);
    }
}