using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using ASTREE_PFE.Models;
using ASTREE_PFE.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ASTREE_PFE.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class UserOnlineStatusController : ControllerBase
    {
        private readonly IUserOnlineStatusService _userOnlineStatusService;

        public UserOnlineStatusController(IUserOnlineStatusService userOnlineStatusService)
        {
            _userOnlineStatusService = userOnlineStatusService;
        }

        [HttpGet("online")]
        public async Task<ActionResult<IEnumerable<UserOnlineStatus>>> GetOnlineUsers()
        {
            var onlineUsers = await _userOnlineStatusService.GetAllOnlineUsersAsync();
            return Ok(onlineUsers);
        }

        [HttpGet("{userId}/status")]
        public async Task<ActionResult<UserOnlineStatus>> GetUserStatus(string userId)
        {
            var status = await _userOnlineStatusService.GetUserStatusAsync(userId);
            if (status == null)
                return NotFound();

            return Ok(status);
        }

        [HttpGet("{userId}/last-seen")]
        public async Task<ActionResult<string>> GetLastSeen(string userId)
        {
            var lastSeen = await _userOnlineStatusService.GetLastSeenTimeAsync(userId);
            if (lastSeen == null)
                return ("Offline");

            var duration = GetHumanReadableDuration(lastSeen.Value);
            return Ok(duration);
        }

        [HttpPost("{userId}/status")]
        public async Task<ActionResult> UpdateUserStatus(string userId, [FromBody] bool isOnline)
        {
            await _userOnlineStatusService.UpdateUserStatusAsync(userId, isOnline);
            return Ok();
        }

        [HttpPost("{userId}/activity")]
        public async Task<ActionResult> UpdateUserActivity(string userId)
        {
            // Replace UpdateLastActivityAsync with UpdateUserHeartbeatAsync
            await _userOnlineStatusService.UpdateUserHeartbeatAsync(userId);
            return Ok();
        }

        private string GetHumanReadableDuration(DateTime lastSeenTime)
        {
            var timeDifference = DateTime.UtcNow - lastSeenTime;

            if (timeDifference.TotalMinutes < 1)
                return "Just now";
            if (timeDifference.TotalMinutes < 60)
                return $"{(int)timeDifference.TotalMinutes} minute(s) ago";
            if (timeDifference.TotalHours < 24)
                return $"{(int)timeDifference.TotalHours} hour(s) ago";
            if (timeDifference.TotalDays < 30)
                return $"{(int)timeDifference.TotalDays} day(s) ago";
            if (timeDifference.TotalDays < 365)
                return $"{(int)(timeDifference.TotalDays / 30)} month(s) ago";

            return $"{(int)(timeDifference.TotalDays / 365)} year(s) ago";
        }
    }
}