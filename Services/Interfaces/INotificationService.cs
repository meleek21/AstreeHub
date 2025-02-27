using ASTREE_PFE.Models;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace ASTREE_PFE.Services.Interfaces
{
    public interface INotificationService
    {
        Task<IEnumerable<Notification>> GetAllNotificationsAsync();
        Task<IEnumerable<Notification>> GetUnreadNotificationsAsync(string recipientId);
        Task<Notification> CreateNotificationAsync(Notification notification);
        Task MarkAsReadAsync(string id);
        Task MarkAllAsReadAsync(string recipientId);
    }
}