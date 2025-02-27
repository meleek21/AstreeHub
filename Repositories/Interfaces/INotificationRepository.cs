using ASTREE_PFE.Models;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace ASTREE_PFE.Repositories
{
    public interface INotificationRepository : IMongoRepository<Notification>
    {
        Task<IEnumerable<Notification>> GetUnreadNotificationsAsync(string recipientId);
        Task MarkAsReadAsync(string id);
        Task MarkAllAsReadAsync(string recipientId);
    }
}