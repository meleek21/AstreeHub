using ASTREE_PFE.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ASTREE_PFE.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class NotificationController : ControllerBase
    {
        private readonly INotificationService _notificationService;

        public NotificationController(INotificationService notificationService)
        {
            _notificationService = notificationService;
        }

        [HttpGet]
        public async Task<IActionResult> GetNotifications([FromQuery] string userId)
        {
            var notifications = await _notificationService.GetNotificationsForUserAsync(userId);
            return Ok(notifications);
        }

        [HttpGet("unread")]
        public async Task<IActionResult> GetUnreadNotifications([FromQuery] string userId)
        {
            var notifications = await _notificationService.GetUnreadNotificationsAsync(userId);
            return Ok(notifications);
        }

        [HttpGet("count")]
        public async Task<IActionResult> GetUnreadNotificationCount([FromQuery] string userId)
        {
            var count = await _notificationService.GetUnreadNotificationCountAsync(userId);
            return Ok(new { count });
        }

        [HttpPut("{notificationId}/read")]
        public async Task<IActionResult> MarkNotificationAsRead(string notificationId, [FromQuery] string userId)
        {
            await _notificationService.MarkAsReadAsync(notificationId);
            return Ok();
        }

        [HttpPut("mark-all-read")]
        public async Task<IActionResult> MarkAllNotificationsAsRead([FromQuery] string userId)
        {
            await _notificationService.MarkAllAsReadAsync(userId);
            return Ok();
        }

        [HttpDelete("{notificationId}")]
        public async Task<IActionResult> DeleteNotification(string notificationId, [FromQuery] string userId)
        {
            var success = await _notificationService.DeleteNotificationAsync(notificationId, userId);
            if (!success)
                return NotFound();

            return NoContent();
        }
    }
}